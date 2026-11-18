import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import type { Persona } from "@/features/personas/types";
import { transfusionesApi } from "@/features/transfusiones/api/transfusiones.api";
import type { Transfusion } from "@/features/transfusiones/types";
import { mensajeDeError } from "@/infrastructure/api/errors";
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
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import { cn } from "@/shared/lib/cn";
import {
  documentoLegible,
  fechaParaInput,
  formatoFecha,
  grupoFactorLegible,
  nombreCompleto,
} from "@/shared/utils/formato";

type Seccion = "registro" | "transfusiones";

export function UnidadTransfusionalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get("seccion");
  const seccion: Seccion = seccionParam === "transfusiones" ? "transfusiones" : "registro";

  const [persona, setPersona] = useState<Persona | null>(null);
  const [termino, setTermino] = useState("");
  const [terminoTabla, setTerminoTabla] = useState(searchParams.get("q") ?? "");
  const [fecha, setFecha] = useState(fechaParaInput(new Date().toISOString()));
  const [lote, setLote] = useState("");
  const [fenotipo1, setFenotipo1] = useState("");
  const [fenotipo2, setFenotipo2] = useState("");
  const [tipoTransfusion, setTipoTransfusion] = useState("");
  const [pci, setPci] = useState("");
  const [pcd, setPcd] = useState("");
  const [rt, setRt] = useState("");
  const [tolerancia, setTolerancia] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [anticuerpo, setAnticuerpo] = useState("");
  const queryClient = useQueryClient();

  const q = searchParams.get("q")?.trim() ?? "";
  const dni = searchParams.get("dni")?.trim() ?? "";
  const tipo = searchParams.get("tipo") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const filtros = { q, dni, tipo, desde, hasta };
  const claveFiltros = `${q}|${dni}|${tipo}|${desde}|${hasta}`;
  const { pagina, porPagina, setPagina, params } = usePaginacion(claveFiltros);

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
  const registros = useQuery({
    queryKey: ["transfusiones", "persona", persona?.id],
    queryFn: () => transfusionesApi.porPersona(persona?.id ?? 0),
    enabled: Boolean(persona?.id),
  });
  const listado = useQuery({
    queryKey: ["transfusiones", "listar", claveFiltros, pagina],
    queryFn: () =>
      transfusionesApi.listar({
        ...params,
        ...(q ? { q } : {}),
        ...(dni ? { dni } : {}),
        ...(tipo ? { idTipoTransfusion: tipo } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      }),
    enabled: seccion === "transfusiones",
  });

  const guardar = useMutation({
    mutationFn: () =>
      transfusionesApi.crear({
        idPersona: persona?.id ?? 0,
        fecha: fecha || null,
        numeroOLote: lote || undefined,
        rt: rt || undefined,
        tolerancia: tolerancia || undefined,
        pci: pci || undefined,
        pcd: pcd || undefined,
        tecnico: tecnico || undefined,
        anticuerpo: anticuerpo || undefined,
        idFenotipo1: Number(fenotipo1) || null,
        idFenotipo2: Number(fenotipo2) || null,
        idTipoTransfusion: Number(tipoTransfusion) || null,
        idGrupoFactor: persona?.idGrupoFactor ?? null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transfusiones", "persona", persona?.id] });
      await queryClient.invalidateQueries({ queryKey: ["transfusiones", "listar"] });
      await queryClient.invalidateQueries({ queryKey: ["personas"] });
    },
  });

  function actualizarParametros(cambios: Record<string, string | null>) {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === "") siguientes.delete(clave);
        else siguientes.set(clave, valor);
      }
      return siguientes;
    });
  }

  function cambiarFiltro(clave: keyof typeof filtros, valor: string) {
    actualizarParametros({ [clave]: valor || null });
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (persona && !guardar.isPending) guardar.mutate();
  }

  const columnasHistorial: Columna<Transfusion>[] = [
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "lote", titulo: "N° / Lote", celda: (item) => <span className="mono">{item.numeroOLote ?? "—"}</span> },
    { clave: "tipo", titulo: "Tipo", celda: (item) => item.tipoTransfusion?.nombre ?? "—" },
    { clave: "rt", titulo: "Compatibilidad (RT)", celda: (item) => item.rt ?? "—" },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (item) => {
        const estado = item.estadoCompatibilidad ?? "SIN_DATOS";
        return (
          <StatusChip tono={estado === "COMPATIBLE" ? "ok" : estado === "INCOMPATIBLE" ? "danger" : "warn"}>
            {estado === "COMPATIBLE" ? "Compatible" : estado === "INCOMPATIBLE" ? "Incompatible" : "Sin datos"}
          </StatusChip>
        );
      },
    },
  ];

  const columnas: Columna<Transfusion>[] = [
    { clave: "nombre", titulo: "Apellido y Nombre", celda: (item) => nombreCompleto(item.persona) },
    {
      clave: "dni",
      titulo: "DNI",
      celda: (item) => <span className="mono">{documentoLegible(item.persona?.dni)}</span>,
    },
    { clave: "gyf", titulo: "Grupo y Factor", celda: (item) => grupoFactorLegible(item.grupoFactor) },
    {
      clave: "fenotipo",
      titulo: "Fenotipo",
      celda: (item) => [item.fenotipo1?.nombre, item.fenotipo2?.nombre].filter(Boolean).join(" / ") || "—",
    },
    { clave: "pci", titulo: "PCI", celda: (item) => item.pci || "—" },
    { clave: "pcd", titulo: "PCD", celda: (item) => item.pcd || "—" },
    { clave: "anticuerpo", titulo: "Id anticuerpo", celda: (item) => item.anticuerpo || "—" },
    { clave: "tipo", titulo: "HC o HD (tipo)", celda: (item) => item.tipoTransfusion?.nombre || "—" },
    {
      clave: "numeroOLote",
      titulo: "HC o HD (numero o lote)",
      celda: (item) => item.numeroOLote || "—",
    },
    { clave: "rt", titulo: "RT", celda: (item) => item.rt || "—" },
    { clave: "tolerancia", titulo: "Toleracia", celda: (item) => item.tolerancia || "—" },
    { clave: "tecnico", titulo: "Tecnico", celda: (item) => item.tecnico || "—" },
  ];

  return (
    <>
      <PageHeader
        title="Unidad transfusional"
        subtitle="Registro de transfusiones y consulta filtrable de datos inmunohematológicos."
      />

      <div className="section-tabs" role="tablist" aria-label="Secciones de Unidad transfusional">
        {(
          [
            ["registro", "Registro de transfusión"],
            ["transfusiones", "Transfusiones"],
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
            onClick={() => actualizarParametros({ seccion: id })}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-registro" aria-labelledby="tab-registro" hidden={seccion !== "registro"}>
        {seccion === "registro" ? (
          <>
            <Section title="Paciente y determinaciones">
              <SelectorPersona
                valor={termino}
                onChange={setTermino}
                onSeleccionar={(encontrada) => {
                  setPersona(encontrada);
                  setTermino(nombreCompleto(encontrada));
                }}
                label="Apellido y nombre / DNI"
              />
              {persona ? (
                <div style={{ marginTop: "var(--s-4)" }}>
                  <PersonBanner
                    persona={persona}
                    estado={presentacionSemaforo(persona.semaforo)}
                    datosExtra={[`HC ${persona.historiaClinica ?? "—"}`]}
                  />
                  <p className="soft" style={{ marginTop: "var(--s-2)" }}>
                    Grupo y factor: {grupoFactorLegible(persona.grupoFactor)}
                  </p>
                </div>
              ) : null}
            </Section>

            <form onSubmit={enviar}>
              <Section title="Hemocomponente y resultado">
                {guardar.isError ? (
                  <Notice tono="danger" titulo="No se pudo guardar el registro">
                    {mensajeDeError(guardar.error)}
                  </Notice>
                ) : null}
                {guardar.isSuccess ? (
                  <Notice tono="info" titulo="Registro guardado">
                    La transfusión quedó asociada a {nombreCompleto(persona)}.
                  </Notice>
                ) : null}

                <div className="form-grid">
                  <Field label="Fecha" htmlFor="transfusion-fecha" ancho={3}>
                    <input id="transfusion-fecha" className="input" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
                  </Field>
                  <Field label="N° / Lote" htmlFor="transfusion-lote" ancho={3}>
                    <input id="transfusion-lote" className="input input--data" value={lote} onChange={(evento) => setLote(evento.target.value)} placeholder="CG2026-00142" />
                  </Field>
                  <Field label="Tipo" htmlFor="transfusion-tipo" ancho={3}>
                    <select id="transfusion-tipo" className="select" value={tipoTransfusion} onChange={(evento) => setTipoTransfusion(evento.target.value)}>
                      <option value="">Sin tipo</option>
                      {(catalogos.data?.tiposTransfusion ?? []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Técnico responsable" htmlFor="transfusion-tecnico" ancho={3}>
                    <input id="transfusion-tecnico" className="input" value={tecnico} onChange={(evento) => setTecnico(evento.target.value)} placeholder="Lic. Pérez, Ana" />
                  </Field>
                  <Field label="Fenotipo" htmlFor="transfusion-fenotipo1" ancho={3}>
                    <select id="transfusion-fenotipo1" className="select" value={fenotipo1} onChange={(evento) => setFenotipo1(evento.target.value)}>
                      <option value="">Sin fenotipo</option>
                      {(catalogos.data?.fenotipos ?? []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Fenotipo 2" htmlFor="transfusion-fenotipo2" ancho={3}>
                    <select id="transfusion-fenotipo2" className="select" value={fenotipo2} onChange={(evento) => setFenotipo2(evento.target.value)}>
                      <option value="">Sin fenotipo</option>
                      {(catalogos.data?.fenotipos ?? []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="PCI" htmlFor="transfusion-pci" ancho={3}>
                    <select id="transfusion-pci" className="select" value={pci} onChange={(evento) => setPci(evento.target.value)}>
                      <option value="">Sin dato</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Positivo">Positivo</option>
                    </select>
                  </Field>
                  <Field label="PCD" htmlFor="transfusion-pcd" ancho={3}>
                    <select id="transfusion-pcd" className="select" value={pcd} onChange={(evento) => setPcd(evento.target.value)}>
                      <option value="">Sin dato</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Positivo">Positivo</option>
                    </select>
                  </Field>
                  <Field label="Id anticuerpo" htmlFor="transfusion-anticuerpo" ancho={6}>
                    <input id="transfusion-anticuerpo" className="input input--data" value={anticuerpo} onChange={(evento) => setAnticuerpo(evento.target.value)} placeholder="Identificación del anticuerpo" />
                  </Field>
                  <Field label="Compatibilidad (RT)" htmlFor="transfusion-rt" ancho={6}>
                    <select id="transfusion-rt" className="select" value={rt} onChange={(evento) => setRt(evento.target.value)}>
                      <option value="">Sin dato</option>
                      <option value="Compatible">Compatible</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Incompatible">Incompatible</option>
                    </select>
                  </Field>
                  <Field label="Tolerancia" htmlFor="transfusion-tolerancia" ancho={6}>
                    <select id="transfusion-tolerancia" className="select" value={tolerancia} onChange={(evento) => setTolerancia(evento.target.value)}>
                      <option value="">Sin dato</option>
                      <option value="Buena">Buena</option>
                      <option value="Regular">Regular</option>
                      <option value="Mala">Mala</option>
                    </select>
                  </Field>
                </div>

                <FormActions
                  submitLabel="Guardar registro"
                  loading={guardar.isPending}
                  disabled={!persona}
                  onCancel={() => {
                    setPersona(null);
                    setTermino("");
                  }}
                  extra={<Button type="button" onClick={() => registros.refetch()} disabled={!persona}>Actualizar historial</Button>}
                />
              </Section>
            </form>

            {persona ? (
              <Section title="Historial de transfusiones" description={nombreCompleto(persona)}>
                <DataTable
                  columnas={columnasHistorial}
                  filas={registros.data?.data ?? []}
                  claveFila={(item) => item.id}
                  cargando={registros.isLoading}
                  error={registros.isError ? "No se pudo consultar el historial." : undefined}
                  onReintentar={() => void registros.refetch()}
                  claveReset={persona?.id}
                />
              </Section>
            ) : null}
          </>
        ) : null}
      </div>

      <div role="tabpanel" id="panel-transfusiones" aria-labelledby="tab-transfusiones" hidden={seccion !== "transfusiones"}>
        {seccion === "transfusiones" ? (
          <>
            <Section title="Buscar transfusión, DNI o lote">
              <SearchField
                label="Transfusión / paciente"
                placeholder="Buscar transfusión, DNI o lote"
                value={terminoTabla}
                onChange={setTerminoTabla}
                onSubmit={() => {
                  actualizarParametros({ q: terminoTabla.trim() || null });
                  setPagina(1);
                }}
              />
            </Section>

            <Section title="Filtros">
              <div className="form-grid">
                <Field label="DNI" htmlFor="filtro-transfusion-dni" ancho={3}>
                  <input
                    id="filtro-transfusion-dni"
                    className="input input--data"
                    value={dni}
                    onChange={(evento) => cambiarFiltro("dni", evento.target.value)}
                    placeholder="DNI del paciente"
                  />
                </Field>
                <Field label="HC o HD (tipo)" htmlFor="filtro-transfusion-tipo" ancho={3}>
                  <select
                    id="filtro-transfusion-tipo"
                    className="select"
                    value={tipo}
                    onChange={(evento) => cambiarFiltro("tipo", evento.target.value)}
                  >
                    <option value="">Todos</option>
                    {(catalogos.data?.tiposTransfusion ?? []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre ?? "—"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Desde" htmlFor="filtro-transfusion-desde" ancho={3}>
                  <input
                    id="filtro-transfusion-desde"
                    className="input"
                    type="date"
                    value={desde}
                    onChange={(evento) => cambiarFiltro("desde", evento.target.value)}
                  />
                </Field>
                <Field label="Hasta" htmlFor="filtro-transfusion-hasta" ancho={3}>
                  <input
                    id="filtro-transfusion-hasta"
                    className="input"
                    type="date"
                    value={hasta}
                    onChange={(evento) => cambiarFiltro("hasta", evento.target.value)}
                  />
                </Field>
                <div className="field field--12 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      actualizarParametros({ q: null, dni: null, tipo: null, desde: null, hasta: null });
                      setTerminoTabla("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Section>

            <div id="transfusiones">
              <Section title="Transfusiones" description="Datos inmunohematológicos de todas las transfusiones registradas">
                <div className="tabla-donaciones">
                  <DataTable
                    columnas={columnas}
                    filas={listado.data?.data ?? []}
                    claveFila={(item) => item.id}
                    cargando={listado.isLoading}
                    error={listado.isError ? "No se pudo consultar el listado de transfusiones." : undefined}
                    onReintentar={() => void listado.refetch()}
                    meta={listado.data?.meta}
                    pagina={pagina}
                    porPagina={porPagina}
                    onCambiarPagina={setPagina}
                    claveReset={claveFiltros}
                  />
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
