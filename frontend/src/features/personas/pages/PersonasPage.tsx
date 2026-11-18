import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import { personasApi } from "@/features/personas/api/personas.api";
import { ubicacionesApi } from "@/features/personas/api/ubicaciones.api";
import type { Persona } from "@/features/personas/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import { cn } from "@/shared/lib/cn";
import { documentoLegible, fechaParaInput, formatoFecha, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

interface Formulario {
  id: number | null;
  idDireccion: number | null;
  dni: string;
  nombre: string;
  apellido: string;
  historiaClinica: string;
  telefono: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  sexoBiologico: "" | "MASCULINO" | "FEMENINO";
  idGrupoFactor: string;
  idProvincia: string;
  idCiudad: string;
  calle: string;
  numero: string;
  piso: string;
  departamento: string;
}

const FORMULARIO_VACIO: Formulario = {
  id: null,
  idDireccion: null,
  dni: "",
  nombre: "",
  apellido: "",
  historiaClinica: "",
  telefono: "",
  fechaNacimiento: "",
  lugarNacimiento: "",
  sexoBiologico: "",
  idGrupoFactor: "",
  idProvincia: "",
  idCiudad: "",
  calle: "",
  numero: "",
  piso: "",
  departamento: "",
};

function formularioDesde(persona: Persona): Formulario {
  return {
    id: persona.id,
    idDireccion: persona.idDireccion,
    dni: persona.dni ?? "",
    nombre: persona.nombre ?? "",
    apellido: persona.apellido ?? "",
    historiaClinica: persona.historiaClinica ?? "",
    telefono: persona.telefono ?? "",
    fechaNacimiento: fechaParaInput(persona.fechaNacimiento),
    lugarNacimiento: persona.lugarNacimiento ?? "",
    sexoBiologico:
      persona.sexoBiologico === "MASCULINO" || persona.sexoBiologico === "FEMENINO" ? persona.sexoBiologico : "",
    idGrupoFactor: persona.idGrupoFactor ? String(persona.idGrupoFactor) : "",
    idProvincia: persona.direccion?.ciudad?.provincia?.id ? String(persona.direccion.ciudad.provincia.id) : "",
    idCiudad: persona.direccion?.ciudad?.id ? String(persona.direccion.ciudad.id) : "",
    calle: persona.direccion?.calle ?? "",
    numero: persona.direccion?.numero ?? "",
    piso: persona.direccion?.piso ?? "",
    departamento: persona.direccion?.departamento ?? "",
  };
}

type Seccion = "registro" | "personas";

export function PersonasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get("seccion");
  const seccion: Seccion = seccionParam === "personas" ? "personas" : "registro";

  const [termino, setTermino] = useState("");
  const consulta = searchParams.get("q")?.trim() ?? "";
  const idSeleccionado = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const queryClient = useQueryClient();

  const [terminoListado, setTerminoListado] = useState(searchParams.get("pq") ?? "");
  const listadoQ = searchParams.get("pq")?.trim() ?? "";
  const listadoSexo = searchParams.get("psexo") ?? "";
  const listadoGf = searchParams.get("pgf") ?? "";
  const claveListado = `${listadoQ}|${listadoSexo}|${listadoGf}`;
  const paginacion = usePaginacion(claveListado);

  const resultados = useQuery({
    queryKey: ["personas", "buscar", consulta],
    queryFn: () => personasApi.buscar(consulta),
    enabled: consulta.length > 0,
  });

  const historial = useQuery({
    queryKey: ["personas", "historial", idSeleccionado],
    queryFn: () => personasApi.historial(idSeleccionado ?? 0),
    enabled: idSeleccionado !== null && Number.isFinite(idSeleccionado),
  });

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
  const listado = useQuery({
    queryKey: ["personas", "listar", claveListado, paginacion.pagina],
    queryFn: () =>
      personasApi.listar({
        ...paginacion.params,
        ...(listadoQ ? { q: listadoQ } : {}),
        ...(listadoSexo ? { sexoBiologico: listadoSexo } : {}),
        ...(listadoGf ? { idGrupoFactor: listadoGf } : {}),
      }),
    enabled: seccion === "personas",
  });
  const provincias = useQuery({ queryKey: ["ubicaciones", "provincias"], queryFn: () => ubicacionesApi.provincias() });
  const ciudades = useQuery({
    queryKey: ["ubicaciones", "ciudades", formulario.idProvincia],
    queryFn: () => ubicacionesApi.ciudades(Number(formulario.idProvincia) || undefined),
    enabled: Boolean(formulario.idProvincia),
  });

  useEffect(() => {
    if (historial.data?.persona) setFormulario(formularioDesde(historial.data.persona));
  }, [historial.data]);

  function cambiar(clave: keyof Formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [clave]: valor }));
  }

  function seleccionar(id: number) {
    setSearchParams({ ...(consulta ? { q: consulta } : {}), id: String(id) });
  }

  function nuevaPersona() {
    setFormulario({ ...FORMULARIO_VACIO, dni: consulta.replace(/\D/g, "") });
    setSearchParams(consulta ? { q: consulta } : {});
  }

  function actualizarParametrosListado(cambios: Record<string, string | null>) {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === "") siguientes.delete(clave);
        else siguientes.set(clave, valor);
      }
      return siguientes;
    });
  }

  function abrirDesdeListado(persona: Persona) {
    setTermino(persona.dni ?? "");
    setSearchParams({ seccion: "registro", q: persona.dni ?? "", id: String(persona.id) });
  }

  const guardar = useMutation({
    mutationFn: async () => {
      const dni = formulario.dni.replace(/[.\s-]/g, "");
      let idDireccion = formulario.idDireccion;
      if (formulario.idCiudad) {
        const domicilio = await ubicacionesApi.crearDomicilio({
          calle: formulario.calle || undefined,
          numero: formulario.numero || undefined,
          piso: formulario.piso || undefined,
          departamento: formulario.departamento || undefined,
          idCiudad: Number(formulario.idCiudad),
        });
        idDireccion = domicilio.id;
      }

      const datos = {
        dni,
        nombre: formulario.nombre || undefined,
        apellido: formulario.apellido || undefined,
        historiaClinica: formulario.historiaClinica || undefined,
        telefono: formulario.telefono || undefined,
        fechaNacimiento: formulario.fechaNacimiento || null,
        lugarNacimiento: formulario.lugarNacimiento || undefined,
        sexoBiologico: formulario.sexoBiologico || undefined,
        idGrupoFactor: Number(formulario.idGrupoFactor) || null,
        idDireccion,
      };

      return formulario.id
        ? personasApi.actualizar(formulario.id, datos)
        : personasApi.crear(datos as Parameters<typeof personasApi.crear>[0]);
    },
    onSuccess: async (persona) => {
      await queryClient.invalidateQueries({ queryKey: ["personas"] });
      setSearchParams({ q: persona.dni ?? "", id: String(persona.id) });
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    guardar.mutate();
  }

  const columnas: Columna<Persona>[] = [
    {
      clave: "dni",
      titulo: "DNI",
      celda: (persona) => <span className="mono">{documentoLegible(persona.dni)}</span>,
    },
    { clave: "nombre", titulo: "Nombre y apellido", celda: (persona) => nombreCompleto(persona) },
    {
      clave: "grupo",
      titulo: "G y F",
      celda: (persona) => <span className="mono">{grupoFactorLegible(persona.grupoFactor)}</span>,
    },
    {
      clave: "nacimiento",
      titulo: "Lugar y fecha de nacimiento",
      celda: (persona) =>
        [persona.lugarNacimiento, formatoFecha(persona.fechaNacimiento)].filter(Boolean).join(", ") || "—",
    },
    {
      clave: "accion",
      titulo: "Historial",
      celda: (persona) => (
        <Button type="button" size="sm" variant="ghost" onClick={() => seleccionar(persona.id)}>
          Abrir
        </Button>
      ),
    },
  ];

  const columnasListado: Columna<Persona>[] = [
    {
      clave: "nombre",
      titulo: "Apellido y Nombre",
      celda: (persona) => nombreCompleto(persona),
    },
    {
      clave: "dni",
      titulo: "DNI",
      celda: (persona) => <span className="mono">{documentoLegible(persona.dni)}</span>,
    },
    {
      clave: "hc",
      titulo: "Historia clínica",
      celda: (persona) => <span className="mono">{persona.historiaClinica || "—"}</span>,
    },
    { clave: "telefono", titulo: "Teléfono", celda: (persona) => persona.telefono || "—" },
    {
      clave: "nacimiento",
      titulo: "Fecha de nacimiento",
      celda: (persona) => formatoFecha(persona.fechaNacimiento),
    },
    { clave: "edad", titulo: "Edad", celda: (persona) => (persona.edad === null || persona.edad === undefined ? "—" : persona.edad) },
    {
      clave: "sexo",
      titulo: "Sexo",
      celda: (persona) =>
        persona.sexoBiologico === "MASCULINO"
          ? "Masculino"
          : persona.sexoBiologico === "FEMENINO"
            ? "Femenino"
            : "—",
    },
    {
      clave: "gyf",
      titulo: "G y F",
      celda: (persona) => <span className="mono">{grupoFactorLegible(persona.grupoFactor)}</span>,
    },
    {
      clave: "direccion",
      titulo: "Domicilio",
      celda: (persona) => direccionLegible(persona),
    },
    {
      clave: "semaforo",
      titulo: "Semaforización",
      celda: (persona) => {
        const semaforo = presentacionSemaforo(persona.semaforo);
        return <StatusChip tono={semaforo.tono}>{semaforo.etiqueta}</StatusChip>;
      },
    },
    {
      clave: "accion",
      titulo: "Historial",
      celda: (persona) => (
        <Button type="button" size="sm" variant="ghost" onClick={() => abrirDesdeListado(persona)}>
          Abrir
        </Button>
      ),
    },
  ];

  const grupoFactor = catalogos.data?.gruposFactor ?? [];

  return (
    <>
      <PageHeader
        title="Personas · Consulta, alta y edición"
        subtitle="Ingresá el DNI para ver datos e historial. Si no existe: crear persona, realizar G y F y completar domicilio/datos."
        actions={
          <Button type="button" variant="primary" onClick={nuevaPersona}>
            Nueva persona
          </Button>
        }
      />

      <div className="section-tabs" role="tablist" aria-label="Secciones de Personas">
        {(
          [
            ["registro", "Consulta y alta"],
            ["personas", "Personas"],
          ] as const
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={seccion === id}
            aria-controls={`panel-${id}`}
            className={cn("section-tabs__tab", seccion === id && "section-tabs__tab--activo")}
            onClick={() => actualizarParametrosListado({ seccion: id })}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-registro" aria-labelledby="tab-registro" hidden={seccion !== "registro"}>
        {seccion === "registro" ? (
          <>
            <Section title="Búsqueda" description="Buscar por DNI, nombre o HC (Ctrl K)">
        <SearchField
          label="DNI / Identificación"
          placeholder="Buscar por DNI, nombre o HC"
          value={termino}
          onChange={setTermino}
          onSubmit={() => setSearchParams(termino.trim() ? { q: termino.trim() } : {})}
        />
      </Section>

      {consulta ? (
        <Section title="Resultados" description={`${resultados.data?.length ?? 0} personas`}>
          <DataTable
            columnas={columnas}
            filas={resultados.data ?? []}
            claveFila={(persona) => persona.id}
            cargando={resultados.isLoading}
            error={resultados.isError ? "No se pudo consultar el padrón de personas." : undefined}
            seleccionada={idSeleccionado}
            onReintentar={() => void resultados.refetch()}
            claveReset={consulta}
          />
        </Section>
      ) : null}

      {historial.data ? (
        <Section
          title="Historial"
          description={`DNI ${documentoLegible(historial.data.persona.dni)} · HC ${historial.data.persona.historiaClinica ?? "—"}`}
        >
          <PersonBanner
            persona={historial.data.persona}
            estado={presentacionSemaforo(historial.data.semaforo)}
            datosExtra={[
              `HC ${historial.data.persona.historiaClinica ?? "—"}`,
              historial.data.persona.telefono ? `Tel. ${historial.data.persona.telefono}` : "",
            ]}
          />
          <p className="soft" style={{ marginTop: "var(--s-3)" }}>
            Donaciones: {historial.data.resumen.donaciones} · Transfusiones: {historial.data.resumen.transfusiones} ·
            Gestante/RN: {historial.data.resumen.estudiosGestante}/{historial.data.resumen.recienNacidos} · Sangrías:{" "}
            {historial.data.resumen.sangrias}
          </p>
          <div className="chip-row" style={{ marginTop: "var(--s-3)" }}>
            <StatusChip tono="brand">{presentacionSemaforo(historial.data.semaforo).etiqueta}</StatusChip>
            <span className="muted">{historial.data.semaforo.motivo}</span>
          </div>
        </Section>
      ) : null}

      <Section
        title="Alta y edición (domicilio editable)"
        description="1) crear persona (DNI) 2) prueba G y F 3) completar datos/domicilio. Guardar valida obligatorios."
      >
        {guardar.isError ? (
          <Notice tono="danger" titulo="No se pudo guardar">
            {mensajeDeError(guardar.error)}
          </Notice>
        ) : null}
        <form className="form-grid" onSubmit={enviar}>
          <Field label="DNI" htmlFor="persona-dni" required ancho={4}>
            <input
              id="persona-dni"
              className="input input--data"
              value={formulario.dni}
              onChange={(evento) => cambiar("dni", evento.target.value)}
              required
            />
          </Field>
          <Field label="Nombre y apellido" htmlFor="persona-nombre" required ancho={4}>
            <input
              id="persona-nombre"
              className="input"
              value={formulario.nombre}
              onChange={(evento) => cambiar("nombre", evento.target.value)}
              required
            />
          </Field>
          <Field label="Apellido" htmlFor="persona-apellido" required ancho={4}>
            <input
              id="persona-apellido"
              className="input"
              value={formulario.apellido}
              onChange={(evento) => cambiar("apellido", evento.target.value)}
              required
            />
          </Field>
          <Field label="Historia clínica" htmlFor="persona-hc" ancho={4}>
            <input
              id="persona-hc"
              className="input"
              value={formulario.historiaClinica}
              onChange={(evento) => cambiar("historiaClinica", evento.target.value)}
            />
          </Field>
          <Field label="Teléfono" htmlFor="persona-telefono" ancho={4}>
            <input
              id="persona-telefono"
              className="input"
              value={formulario.telefono}
              onChange={(evento) => cambiar("telefono", evento.target.value)}
              placeholder="221-555-1234"
            />
          </Field>
          <Field label="Grupo y factor" htmlFor="persona-gf" ancho={4}>
            <select
              id="persona-gf"
              className="select"
              value={formulario.idGrupoFactor}
              onChange={(evento) => cambiar("idGrupoFactor", evento.target.value)}
            >
              <option value="">Sin determinar</option>
              {grupoFactor.map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.grupo, item.factor].filter(Boolean).join("")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lugar y fecha de nacimiento" htmlFor="persona-nacimiento" ancho={4}>
            <input
              id="persona-nacimiento"
              className="input"
              type="date"
              value={formulario.fechaNacimiento}
              onChange={(evento) => cambiar("fechaNacimiento", evento.target.value)}
            />
          </Field>
          <Field label="Lugar de nacimiento" htmlFor="persona-lugar" ancho={4}>
            <input
              id="persona-lugar"
              className="input"
              value={formulario.lugarNacimiento}
              onChange={(evento) => cambiar("lugarNacimiento", evento.target.value)}
              placeholder="La Plata"
            />
          </Field>
          <Field label="Sexo biológico" htmlFor="persona-sexo" ancho={4}>
            <select
              id="persona-sexo"
              className="select"
              value={formulario.sexoBiologico}
              onChange={(evento) => cambiar("sexoBiologico", evento.target.value)}
            >
              <option value="">Sin dato</option>
              <option value="FEMENINO">Femenino</option>
              <option value="MASCULINO">Masculino</option>
            </select>
          </Field>
          <Field label="Provincia" htmlFor="persona-provincia" ancho={4}>
            <select
              id="persona-provincia"
              className="select"
              value={formulario.idProvincia}
              onChange={(evento) => {
                setFormulario((actual) => ({ ...actual, idProvincia: evento.target.value, idCiudad: "" }));
              }}
            >
              <option value="">Sin provincia</option>
              {(provincias.data?.data ?? []).map((provincia) => (
                <option key={provincia.id} value={provincia.id}>
                  {provincia.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ciudad" htmlFor="persona-ciudad" ancho={4}>
            <select
              id="persona-ciudad"
              className="select"
              value={formulario.idCiudad}
              onChange={(evento) => cambiar("idCiudad", evento.target.value)}
            >
              <option value="">Sin ciudad</option>
              {(ciudades.data?.data ?? []).map((ciudad) => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Calle y número" htmlFor="persona-calle" ancho={4}>
            <div className="input-row">
              <input
                id="persona-calle"
                className="input"
                value={formulario.calle}
                onChange={(evento) => cambiar("calle", evento.target.value)}
                placeholder="Calle 7"
              />
              <input
                aria-label="Número"
                className="input input--data"
                value={formulario.numero}
                onChange={(evento) => cambiar("numero", evento.target.value)}
                placeholder="1234"
              />
            </div>
          </Field>
          <Field label="Piso" htmlFor="persona-piso" ancho={2}>
            <input
              id="persona-piso"
              className="input"
              value={formulario.piso}
              onChange={(evento) => cambiar("piso", evento.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Depto" htmlFor="persona-depto" ancho={2}>
            <input
              id="persona-depto"
              className="input"
              value={formulario.departamento}
              onChange={(evento) => cambiar("departamento", evento.target.value)}
              placeholder="—"
            />
          </Field>
          <div className="field field--12">
            <FormActions
              submitLabel="Guardar"
              loading={guardar.isPending}
              onCancel={() => setFormulario(FORMULARIO_VACIO)}
            />
          </div>
        </form>
      </Section>
          </>
        ) : null}
      </div>

      <div role="tabpanel" id="panel-personas" aria-labelledby="tab-personas" hidden={seccion !== "personas"}>
        {seccion === "personas" ? (
          <>
            <Section title="Buscar persona">
              <SearchField
                label="Persona"
                placeholder="Buscar por DNI, nombre, apellido o HC"
                value={terminoListado}
                onChange={setTerminoListado}
                onSubmit={() => {
                  actualizarParametrosListado({ pq: terminoListado.trim() || null });
                  paginacion.setPagina(1);
                }}
              />
            </Section>

            <Section title="Filtros">
              <div className="form-grid">
                <Field label="Sexo biológico" htmlFor="filtro-persona-sexo" ancho={4}>
                  <select
                    id="filtro-persona-sexo"
                    className="select"
                    value={listadoSexo}
                    onChange={(evento) => actualizarParametrosListado({ psexo: evento.target.value || null })}
                  >
                    <option value="">Todos</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="MASCULINO">Masculino</option>
                  </select>
                </Field>
                <Field label="Grupo y factor" htmlFor="filtro-persona-gf" ancho={4}>
                  <select
                    id="filtro-persona-gf"
                    className="select"
                    value={listadoGf}
                    onChange={(evento) => actualizarParametrosListado({ pgf: evento.target.value || null })}
                  >
                    <option value="">Todos</option>
                    {(catalogos.data?.gruposFactor ?? []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {[item.grupo, item.factor].filter(Boolean).join("")}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="field field--4 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      actualizarParametrosListado({ pq: null, psexo: null, pgf: null });
                      setTerminoListado("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Section>

            <Section title="Personas" description="Todas las personas cargadas en el sistema">
              <div className="tabla-donaciones">
                <DataTable
                  columnas={columnasListado}
                  filas={listado.data?.data ?? []}
                  claveFila={(persona) => persona.id}
                  cargando={listado.isLoading}
                  error={listado.isError ? "No se pudo consultar el listado de personas." : undefined}
                  onReintentar={() => void listado.refetch()}
                  meta={listado.data?.meta}
                  pagina={paginacion.pagina}
                  porPagina={paginacion.porPagina}
                  onCambiarPagina={paginacion.setPagina}
                  claveReset={claveListado}
                />
              </div>
            </Section>
          </>
        ) : null}
      </div>
    </>
  );
}

function direccionLegible(persona: Persona): string {
  const direccion = persona.direccion;
  if (!direccion) return "—";
  return (
    [
      direccion.calle,
      direccion.numero,
      direccion.piso,
      direccion.departamento,
      direccion.ciudad?.nombre,
      direccion.ciudad?.provincia?.nombre,
    ]
      .filter(Boolean)
      .join(" ") || "—"
  );
}
