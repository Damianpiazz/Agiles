import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import type { Persona } from "@/features/personas/types";
import { gestantesApi } from "@/features/gestantes/api/gestantes.api";
import { recienNacidosApi } from "@/features/gestantes/api/recien-nacidos.api";
import type { EstudioGestante, RecienNacido } from "@/features/gestantes/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import { cn } from "@/shared/lib/cn";
import {
  documentoLegible,
  fechaParaInput,
  formatoFecha,
  nombreCompleto,
} from "@/shared/utils/formato";

type Seccion = "registro" | "gestantes" | "recienNacidos";
type Resultado = { resultado?: string | null; antigeno?: { nombre?: string | null } | null };

const RESULTADOS = ["Negativo", "Positivo", "No reactivo", "Reactivo"];

function horaActual(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function GestantesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get("seccion");
  const seccion: Seccion =
    seccionParam === "gestantes" || seccionParam === "recienNacidos" ? seccionParam : "registro";

  const [persona, setPersona] = useState<Persona | null>(null);
  const [termino, setTermino] = useState("");
  const [terminoGestantes, setTerminoGestantes] = useState(searchParams.get("gq") ?? "");
  const [terminoRn, setTerminoRn] = useState(searchParams.get("rq") ?? "");
  const [fecha, setFecha] = useState(fechaParaInput(new Date().toISOString()));
  const [numero, setNumero] = useState("");
  const [operador, setOperador] = useState("");
  const [pciMadre, setPciMadre] = useState("");
  const [conyugal, setConyugal] = useState("");
  const [rnNombre, setRnNombre] = useState("");
  const [rnDni, setRnDni] = useState("");
  const [rnGrupoFactor, setRnGrupoFactor] = useState("");
  const [ipAntiD, setIpAntiD] = useState("");
  const [pcdRn, setPcdRn] = useState("");
  const [pciRn, setPciRn] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const queryClient = useQueryClient();
  const historialRn = usePaginacion(persona?.id ?? null);

  const gq = searchParams.get("gq")?.trim() ?? "";
  const gdni = searchParams.get("gdni")?.trim() ?? "";
  const gdesde = searchParams.get("gdesde") ?? "";
  const ghasta = searchParams.get("ghasta") ?? "";
  const claveGestantes = `${gq}|${gdni}|${gdesde}|${ghasta}`;
  const pagGestantes = usePaginacion(claveGestantes);

  const rq = searchParams.get("rq")?.trim() ?? "";
  const rdni = searchParams.get("rdni")?.trim() ?? "";
  const rdesde = searchParams.get("rdesde") ?? "";
  const rhasta = searchParams.get("rhasta") ?? "";
  const claveRn = `${rq}|${rdni}|${rdesde}|${rhasta}`;
  const pagRn = usePaginacion(claveRn);

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
  const gestantes = useQuery({
    queryKey: ["gestantes", "persona", persona?.id],
    queryFn: () => gestantesApi.porPersona(persona?.id ?? 0),
    enabled: Boolean(persona?.id),
  });
  const recienNacidos = useQuery({
    queryKey: ["recien-nacidos", "madre", persona?.id, historialRn.pagina],
    queryFn: () => recienNacidosApi.listar({ madreId: persona?.id ?? 0, ...historialRn.params }),
    enabled: Boolean(persona?.id),
  });
  const listadoGestantes = useQuery({
    queryKey: ["gestantes", "listar", claveGestantes, pagGestantes.pagina],
    queryFn: () =>
      gestantesApi.listar({
        ...pagGestantes.params,
        ...(gq ? { q: gq } : {}),
        ...(gdni ? { dni: gdni } : {}),
        ...(gdesde ? { desde: gdesde } : {}),
        ...(ghasta ? { hasta: ghasta } : {}),
      }),
    enabled: seccion === "gestantes",
  });
  const listadoRn = useQuery({
    queryKey: ["recien-nacidos", "listar", claveRn, pagRn.pagina],
    queryFn: () =>
      recienNacidosApi.listar({
        ...pagRn.params,
        ...(rq ? { q: rq } : {}),
        ...(rdni ? { dni: rdni } : {}),
        ...(rdesde ? { desde: rdesde } : {}),
        ...(rhasta ? { hasta: rhasta } : {}),
      }),
    enabled: seccion === "recienNacidos",
  });

  const primerAntigeno = catalogos.data?.antigenos?.[0]?.id;
  const primeraDeterminacion = catalogos.data?.determinacionesPcd?.[0]?.id;

  const guardarGestante = useMutation({
    mutationFn: () =>
      gestantesApi.guardarCompleta({
        idPersona: persona?.id ?? 0,
        estudio: {
          numero: numero || undefined,
          fecha: fecha || null,
          operador: operador || undefined,
        },
        pci: pciMadre
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primerAntigeno ? [{ antigenoId: primerAntigeno, resultado: pciMadre }] : [],
            }
          : undefined,
        compatibilidadConyugal: conyugal
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primerAntigeno ? [{ antigenoId: primerAntigeno, resultado: conyugal }] : [],
            }
          : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gestantes", "persona", persona?.id] });
      await queryClient.invalidateQueries({ queryKey: ["gestantes", "listar"] });
    },
  });

  const guardarRn = useMutation({
    mutationFn: () =>
      recienNacidosApi.guardarCompleta({
        estudio: {
          numero: numero || undefined,
          fecha: fecha || null,
          rn: rnNombre || undefined,
          dni: rnDni || undefined,
          idMadre: persona?.id ?? null,
          idGrupoFactor: Number(rnGrupoFactor) || null,
          ipAntiD: ipAntiD || undefined,
          operador: operador || undefined,
          observaciones: observaciones || undefined,
        },
        pci: pciRn
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primerAntigeno ? [{ antigenoId: primerAntigeno, resultado: pciRn }] : [],
            }
          : undefined,
        pcd: pcdRn
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primeraDeterminacion ? [{ idDeterminacionPcd: primeraDeterminacion, resultado: pcdRn }] : [],
            }
          : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recien-nacidos", "madre", persona?.id] });
      await queryClient.invalidateQueries({ queryKey: ["recien-nacidos", "listar"] });
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

  function cambiarFiltro(clave: string, valor: string) {
    actualizarParametros({ [clave]: valor || null });
  }

  function seleccionar(encontrada: Persona) {
    setPersona(encontrada);
    setTermino(nombreCompleto(encontrada));
  }

  function limpiar() {
    setPersona(null);
    setTermino("");
  }

  const columnasGestante: Columna<EstudioGestante>[] = [
    { clave: "numero", titulo: "N°", celda: (item) => <span className="mono">{item.numero ?? "—"}</span> },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "operador", titulo: "Operador", celda: (item) => item.operador ?? "—" },
    { clave: "pci", titulo: "PCI", celda: (item) => resultadoLegible(item.pciAsociados?.[0]?.pci?.resultados) },
  ];

  const columnasRn: Columna<RecienNacido>[] = [
    { clave: "rn", titulo: "RN", celda: (item) => item.rn ?? "—" },
    { clave: "dni", titulo: "DNI RN", celda: (item) => <span className="mono">{documentoLegible(item.dni)}</span> },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "ip", titulo: "IP anti-D", celda: (item) => item.ipAntiD ?? "—" },
  ];

  const columnasGestantesTabla: Columna<EstudioGestante>[] = [
    { clave: "numero", titulo: "Numero", celda: (item) => <span className="mono">{item.numero ?? "—"}</span> },
    { clave: "paciente", titulo: "Paciente", celda: (item) => nombreCompleto(item.gestante) },
    {
      clave: "dni",
      titulo: "DNI",
      celda: (item) => <span className="mono">{documentoLegible(item.gestante?.dni)}</span>,
    },
    { clave: "telefono", titulo: "Telefono", celda: (item) => item.gestante?.telefono || "—" },
    { clave: "gyf", titulo: "Grupo y Factor", celda: (item) => grupoFactorCorto(item.gestante?.grupoFactor) },
    {
      clave: "pci",
      titulo: "PCI",
      celda: (item) => resultadoLegible(item.pciAsociados?.[0]?.pci?.resultados),
    },
  ];

  const columnasRnTabla: Columna<RecienNacido>[] = [
    { clave: "numero", titulo: "N°", celda: (item) => item.numero ?? "—" },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "rn", titulo: "RN", celda: (item) => item.rn ?? "—" },
    {
      clave: "dni",
      titulo: "DNI",
      celda: (item) => <span className="mono">{documentoLegible(item.dni)}</span>,
    },
    { clave: "gyf", titulo: "GyF", celda: (item) => grupoFactorCorto(item.grupoFactor) },
    { clave: "pcd", titulo: "PCD", celda: (item) => resultadoLegible(item.pcd?.resultados) },
    { clave: "gyfMadre", titulo: "GyF Madre", celda: (item) => grupoFactorCorto(item.madre?.grupoFactor) },
    { clave: "pci", titulo: "PCI", celda: (item) => resultadoLegible(item.pci?.resultados) },
    { clave: "ip", titulo: "IP anti-D", celda: (item) => item.ipAntiD || "—" },
    { clave: "observaciones", titulo: "Observaciones", celda: (item) => item.observaciones || "—" },
  ];

  return (
    <>
      <PageHeader
        title="Gestantes y recién nacidos"
        subtitle="Estudios inmunohematológicos, registro y consulta filtrable de gestantes y recién nacidos."
      />

      <div className="section-tabs" role="tablist" aria-label="Secciones de Gestantes">
        {(
          [
            ["registro", "Registro"],
            ["gestantes", "Estudios a gestantes"],
            ["recienNacidos", "Estudios a recién nacidos"],
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
            <Section title="Paciente">
              <SelectorPersona valor={termino} onChange={setTermino} onSeleccionar={seleccionar} label="Paciente / madre" />
              {persona ? (
                <div style={{ marginTop: "var(--s-4)" }}>
                  <PersonBanner
                    persona={persona}
                    estado={presentacionSemaforo(persona.semaforo)}
                    datosExtra={[`HC ${persona.historiaClinica ?? "—"}`]}
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={limpiar} style={{ marginTop: "var(--s-2)" }}>
                    Cambiar paciente
                  </Button>
                </div>
              ) : null}
            </Section>

            <form
              onSubmit={(evento: FormEvent<HTMLFormElement>) => {
                evento.preventDefault();
                if (persona && !guardarGestante.isPending) guardarGestante.mutate();
              }}
            >
              <Section title="Estudio de gestante" description="PCI (Coombs indirecta) y compatibilidad conyugal">
                {guardarGestante.isError ? (
                  <Notice tono="danger" titulo="No se pudo guardar el estudio de gestante">
                    {mensajeDeError(guardarGestante.error)}
                  </Notice>
                ) : null}
                <div className="form-grid">
                  <Field label="N° de estudio" htmlFor="gestante-numero" ancho={3}>
                    <input id="gestante-numero" className="input" value={numero} onChange={(evento) => setNumero(evento.target.value)} />
                  </Field>
                  <Field label="Fecha" htmlFor="gestante-fecha" ancho={3}>
                    <input id="gestante-fecha" className="input" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
                  </Field>
                  <Field label="Operador" htmlFor="gestante-operador" ancho={3}>
                    <input id="gestante-operador" className="input" value={operador} onChange={(evento) => setOperador(evento.target.value)} />
                  </Field>
                  <Field label="PCI (Coombs indirecta)" htmlFor="gestante-pci" ancho={3}>
                    <select id="gestante-pci" className="select" value={pciMadre} onChange={(evento) => setPciMadre(evento.target.value)}>
                      <option value="">Pendiente de carga</option>
                      {RESULTADOS.map((resultado) => (
                        <option key={resultado} value={resultado}>{resultado}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Compatibilidad conyugal" htmlFor="gestante-conyugal" ancho={6}>
                    <select id="gestante-conyugal" className="select" value={conyugal} onChange={(evento) => setConyugal(evento.target.value)}>
                      <option value="">Pendiente de carga</option>
                      {RESULTADOS.map((resultado) => (
                        <option key={resultado} value={resultado}>{resultado}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <FormActions submitLabel="Guardar estudios" loading={guardarGestante.isPending} disabled={!persona} />
              </Section>
            </form>

            {persona ? (
              <Section title="Estudios de gestante registrados">
                <DataTable
                  columnas={columnasGestante}
                  filas={gestantes.data?.data ?? []}
                  claveFila={(item) => item.id}
                  cargando={gestantes.isLoading}
                  onReintentar={() => void gestantes.refetch()}
                  claveReset={persona?.id}
                />
              </Section>
            ) : null}

            <form
              onSubmit={(evento: FormEvent<HTMLFormElement>) => {
                evento.preventDefault();
                if (persona && !guardarRn.isPending) guardarRn.mutate();
              }}
            >
              <Section title="Estudio de recién nacido" description="Datos del RN, PCD, PCI y profilaxis con IP anti-D">
                {guardarRn.isError ? (
                  <Notice tono="danger" titulo="No se pudo guardar el estudio del RN">
                    {mensajeDeError(guardarRn.error)}
                  </Notice>
                ) : null}
                <div className="form-grid">
                  <Field label="RN" htmlFor="rn-nombre" ancho={4}>
                    <input id="rn-nombre" className="input" value={rnNombre} onChange={(evento) => setRnNombre(evento.target.value)} placeholder="Fernández (RN)" />
                  </Field>
                  <Field label="DNI RN" htmlFor="rn-dni" ancho={4}>
                    <input id="rn-dni" className="input input--data" value={rnDni} onChange={(evento) => setRnDni(evento.target.value)} />
                  </Field>
                  <Field label="GyF RN" htmlFor="rn-gf" ancho={4}>
                    <select id="rn-gf" className="select" value={rnGrupoFactor} onChange={(evento) => setRnGrupoFactor(evento.target.value)}>
                      <option value="">Sin grupo</option>
                      {(catalogos.data?.gruposFactor ?? []).map((item) => (
                        <option key={item.id} value={item.id}>{[item.grupo, item.factor].filter(Boolean).join("")}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="PCD" htmlFor="rn-pcd" ancho={3}>
                    <select id="rn-pcd" className="select" value={pcdRn} onChange={(evento) => setPcdRn(evento.target.value)}>
                      <option value="">Pendiente</option>
                      {RESULTADOS.map((resultado) => <option key={resultado} value={resultado}>{resultado}</option>)}
                    </select>
                  </Field>
                  <Field label="PCI" htmlFor="rn-pci" ancho={3}>
                    <select id="rn-pci" className="select" value={pciRn} onChange={(evento) => setPciRn(evento.target.value)}>
                      <option value="">Pendiente</option>
                      {RESULTADOS.map((resultado) => <option key={resultado} value={resultado}>{resultado}</option>)}
                    </select>
                  </Field>
                  <Field label="IP anti-D" htmlFor="rn-ip" ancho={3}>
                    <select id="rn-ip" className="select" value={ipAntiD} onChange={(evento) => setIpAntiD(evento.target.value)}>
                      <option value="">Sin dato</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </Field>
                  <Field label="Observaciones" htmlFor="rn-observaciones" ancho={3}>
                    <input id="rn-observaciones" className="input" value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} />
                  </Field>
                </div>
                <FormActions submitLabel="Guardar estudio del RN" loading={guardarRn.isPending} disabled={!persona} />
              </Section>
            </form>

            {persona ? (
              <Section title="Recién nacidos registrados">
                <DataTable
                  columnas={columnasRn}
                  filas={recienNacidos.data?.data ?? []}
                  claveFila={(item) => item.id}
                  cargando={recienNacidos.isLoading}
                  onReintentar={() => void recienNacidos.refetch()}
                  meta={recienNacidos.data?.meta}
                  pagina={historialRn.pagina}
                  porPagina={historialRn.porPagina}
                  onCambiarPagina={historialRn.setPagina}
                />
              </Section>
            ) : null}
          </>
        ) : null}
      </div>

      <div role="tabpanel" id="panel-gestantes" aria-labelledby="tab-gestantes" hidden={seccion !== "gestantes"}>
        {seccion === "gestantes" ? (
          <>
            <Section title="Buscar estudio, paciente o DNI">
              <SearchField
                label="Gestante"
                placeholder="Buscar por paciente o DNI"
                value={terminoGestantes}
                onChange={setTerminoGestantes}
                onSubmit={() => {
                  actualizarParametros({ gq: terminoGestantes.trim() || null });
                  pagGestantes.setPagina(1);
                }}
              />
            </Section>

            <Section title="Filtros">
              <div className="form-grid">
                <Field label="DNI" htmlFor="filtro-gestante-dni" ancho={4}>
                  <input
                    id="filtro-gestante-dni"
                    className="input input--data"
                    value={gdni}
                    onChange={(evento) => cambiarFiltro("gdni", evento.target.value)}
                    placeholder="DNI de la paciente"
                  />
                </Field>
                <Field label="Desde" htmlFor="filtro-gestante-desde" ancho={4}>
                  <input
                    id="filtro-gestante-desde"
                    className="input"
                    type="date"
                    value={gdesde}
                    onChange={(evento) => cambiarFiltro("gdesde", evento.target.value)}
                  />
                </Field>
                <Field label="Hasta" htmlFor="filtro-gestante-hasta" ancho={4}>
                  <input
                    id="filtro-gestante-hasta"
                    className="input"
                    type="date"
                    value={ghasta}
                    onChange={(evento) => cambiarFiltro("ghasta", evento.target.value)}
                  />
                </Field>
                <div className="field field--12 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      actualizarParametros({ gq: null, gdni: null, gdesde: null, ghasta: null });
                      setTerminoGestantes("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Section>

            <div id="gestantes">
              <Section title="Estudios Inmunohematologicos a Gestantes">
                <div className="tabla-donaciones">
                  <DataTable
                    columnas={columnasGestantesTabla}
                    filas={listadoGestantes.data?.data ?? []}
                    claveFila={(item) => item.id}
                    cargando={listadoGestantes.isLoading}
                    error={listadoGestantes.isError ? "No se pudo consultar el listado de gestantes." : undefined}
                    onReintentar={() => void listadoGestantes.refetch()}
                    meta={listadoGestantes.data?.meta}
                    pagina={pagGestantes.pagina}
                    porPagina={pagGestantes.porPagina}
                    onCambiarPagina={pagGestantes.setPagina}
                    claveReset={claveGestantes}
                  />
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </div>

      <div role="tabpanel" id="panel-recienNacidos" aria-labelledby="tab-recienNacidos" hidden={seccion !== "recienNacidos"}>
        {seccion === "recienNacidos" ? (
          <>
            <Section title="Buscar RN, madre o DNI">
              <SearchField
                label="Recién nacido"
                placeholder="Buscar por RN, madre o DNI"
                value={terminoRn}
                onChange={setTerminoRn}
                onSubmit={() => {
                  actualizarParametros({ rq: terminoRn.trim() || null });
                  pagRn.setPagina(1);
                }}
              />
            </Section>

            <Section title="Filtros">
              <div className="form-grid">
                <Field label="DNI" htmlFor="filtro-rn-dni" ancho={4}>
                  <input
                    id="filtro-rn-dni"
                    className="input input--data"
                    value={rdni}
                    onChange={(evento) => cambiarFiltro("rdni", evento.target.value)}
                    placeholder="DNI del recién nacido"
                  />
                </Field>
                <Field label="Desde" htmlFor="filtro-rn-desde" ancho={4}>
                  <input
                    id="filtro-rn-desde"
                    className="input"
                    type="date"
                    value={rdesde}
                    onChange={(evento) => cambiarFiltro("rdesde", evento.target.value)}
                  />
                </Field>
                <Field label="Hasta" htmlFor="filtro-rn-hasta" ancho={4}>
                  <input
                    id="filtro-rn-hasta"
                    className="input"
                    type="date"
                    value={rhasta}
                    onChange={(evento) => cambiarFiltro("rhasta", evento.target.value)}
                  />
                </Field>
                <div className="field field--12 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      actualizarParametros({ rq: null, rdni: null, rdesde: null, rhasta: null });
                      setTerminoRn("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Section>

            <div id="recien-nacidos">
              <Section title="Estudios Inmunohematologicos a Recien Nacidos">
                <div className="tabla-donaciones">
                  <DataTable
                    columnas={columnasRnTabla}
                    filas={listadoRn.data?.data ?? []}
                    claveFila={(item) => item.id}
                    cargando={listadoRn.isLoading}
                    error={listadoRn.isError ? "No se pudo consultar el listado de recién nacidos." : undefined}
                    onReintentar={() => void listadoRn.refetch()}
                    meta={listadoRn.data?.meta}
                    pagina={pagRn.pagina}
                    porPagina={pagRn.porPagina}
                    onCambiarPagina={pagRn.setPagina}
                    claveReset={claveRn}
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

function grupoFactorCorto(
  grupoFactor: { grupo?: string | null; factor?: string | null } | null | undefined,
): string {
  if (!grupoFactor?.grupo) return "—";
  const grupo = grupoFactor.grupo === "O" ? "0" : grupoFactor.grupo;
  const factor =
    grupoFactor.factor === "POSITIVO" || grupoFactor.factor === "+"
      ? "+"
      : grupoFactor.factor === "NEGATIVO" || grupoFactor.factor === "-"
        ? "-"
        : grupoFactor.factor ?? "";
  return `${grupo}${factor}`;
}

function resultadoLegible(resultados: Resultado[] | undefined): string {
  const resultado = resultados?.[0];
  if (!resultado?.resultado) return "Sin dato";
  const antigeno = resultado.antigeno?.nombre;
  return antigeno && /positiv/i.test(resultado.resultado)
    ? `${resultado.resultado} (${antigeno})`
    : resultado.resultado;
}
