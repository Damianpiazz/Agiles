import { useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { donacionesApi } from "@/features/donaciones/api/donaciones.api";
import { EstudiosModal } from "@/features/donaciones/components/EstudiosModal";
import { RegistroDonacion, type FocoEstudios } from "@/features/donaciones/components/RegistroDonacion";
import type { Donacion, EstudiosInput } from "@/features/donaciones/types";
import type { Persona } from "@/features/personas/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { cn } from "@/shared/lib/cn";
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import {
  documentoLegible,
  formatoFecha,
  formatoNumero,
  grupoFactorLegible,
  nombreCompleto,
} from "@/shared/utils/formato";

type Seccion = "registro" | "donaciones";
type TipoEstudio = "PCI" | "PRIMERA" | "SEGUNDA";

export function PostaFijaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [termino, setTermino] = useState(searchParams.get("q") ?? "");
  const [borrador, setBorrador] = useState<EstudiosInput | null>(null);

  const seccionParam = searchParams.get("seccion");
  const seccion: Seccion = seccionParam === "donaciones" ? "donaciones" : "registro";

  const q = searchParams.get("q")?.trim() ?? "";
  const dni = searchParams.get("dni")?.trim() ?? "";
  const tipo = searchParams.get("tipo") ?? "";
  const estado = searchParams.get("estado") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const dniReceptor = searchParams.get("dniReceptor")?.trim() ?? "";
  const filtros = { q, dni, tipo, estado, desde, hasta };
  const claveFiltros = `${q}|${dni}|${tipo}|${estado}|${dniReceptor}|${desde}|${hasta}`;
  const { pagina, porPagina, setPagina, params } = usePaginacion(claveFiltros);

  const donacionParam = searchParams.get("donacion");
  const donacionId =
    donacionParam && /^\d+$/.test(donacionParam)
      ? Number(donacionParam) > 0
        ? Number(donacionParam)
        : null
      : null;
  const modalAbierto = searchParams.get("modal") === "estudios" && donacionParam !== null && donacionParam !== "";

  const focoParam = searchParams.get("foco");
  const foco: FocoEstudios =
    focoParam === "PCI" || focoParam === "PRIMERA" || focoParam === "SEGUNDA" || focoParam === "TODOS"
      ? focoParam
      : "TODOS";

  const donaciones = useQuery({
    queryKey: ["donaciones", "listar", claveFiltros, pagina],
    queryFn: () =>
      donacionesApi.listar({
        ...params,
        ...(q ? { q } : {}),
        ...(dni ? { dni } : {}),
        ...(tipo ? { tipo } : {}),
        ...(estado ? { estado } : {}),
        ...(dniReceptor ? { dniReceptor } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      }),
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

  function abrirEstudios(idDonacion: number | null, estudioFoco: FocoEstudios) {
    actualizarParametros({
      modal: "estudios",
      donacion: String(idDonacion ?? 0),
      foco: estudioFoco,
    });
  }

  function cerrarEstudios() {
    actualizarParametros({ modal: null, donacion: null, foco: null });
  }

  function cambiarFiltro(clave: keyof typeof filtros, valor: string) {
    actualizarParametros({ [clave]: valor || null });
  }

  const columnas: Columna<Donacion>[] = [
    {
      clave: "idDonante",
      titulo: "Id Donante",
      celda: (donacion) => <span className="mono">{donacion.idPersona ?? donacion.persona?.id ?? "—"}</span>,
    },
    { clave: "nombre", titulo: "Nombre y Apellido", celda: (donacion) => nombreCompleto(donacion.persona) },
    {
      clave: "dni",
      titulo: "DNI",
      celda: (donacion) => <span className="mono">{documentoLegible(donacion.persona?.dni)}</span>,
    },
    {
      clave: "nacimiento",
      titulo: "Lugar y Fecha de Nacimiento",
      celda: (donacion) => lugarYFechaNacimiento(donacion.persona),
    },
    { clave: "direccion", titulo: "Dirección", celda: (donacion) => direccionLegible(donacion.persona) },
    { clave: "telefono", titulo: "Teléfono", celda: (donacion) => donacion.persona?.telefono || "—" },
    { clave: "peso", titulo: "Peso", celda: (donacion) => (donacion.peso ? `${formatoNumero(Number(donacion.peso))} kg` : "—") },
    { clave: "tension", titulo: "Tensión Arterial", celda: (donacion) => donacion.tensionArterial || "—" },
    {
      clave: "hemoglobina",
      titulo: "Hemoglobina",
      celda: (donacion) => (donacion.hemoglobina ? `${formatoNumero(Number(donacion.hemoglobina))} g/dl` : "—"),
    },
    {
      clave: "fechasDonaciones",
      titulo: "Fechas de Donaciones",
      celda: (donacion) =>
        donacion.fechasDonaciones?.length
          ? donacion.fechasDonaciones.map(formatoFecha).join(", ")
          : formatoFecha(donacion.fecha),
    },
    {
      clave: "paciente",
      titulo: "Paciente",
      celda: (donacion) =>
        donacion.dniReceptorReposicion ? <span className="mono">{documentoLegible(donacion.dniReceptorReposicion)}</span> : "—",
    },
    { clave: "voluntario", titulo: "Voluntario", celda: (donacion) => (donacion.voluntario ? "Sí" : "No") },
    { clave: "reposicion", titulo: "Reposición", celda: (donacion) => (donacion.reposicion ? "Sí" : "No") },
    { clave: "autoexcluido", titulo: "AutoExcluido", celda: (donacion) => (donacion.autoexcluido ? "Sí" : "No") },
    { clave: "observaciones", titulo: "Observaciones", celda: (donacion) => donacion.observaciones || "—" },
    { clave: "gyf", titulo: "G y F", celda: (donacion) => grupoFactorLegible(donacion.grupoFactor) },
    ...(["PCI", "PRIMERA", "SEGUNDA"] as const).map<Columna<Donacion>>((tipoEstudio) => ({
      clave: `estudio-${tipoEstudio}`,
      titulo: tituloEstudio(tipoEstudio),
      celda: (donacion) => {
        const estudio = estadoEstudio(donacion, tipoEstudio);
        return (
          <div className="celda-estudio">
            <StatusChip tono={estudio.hecho ? "ok" : "warn"}>{estudio.etiqueta}</StatusChip>
            <button
              type="button"
              className="celda-estudio__accion"
              onClick={() => abrirEstudios(donacion.id, tipoEstudio)}
            >
              {estudio.hecho ? "Ver / cargar →" : "Cargar →"}
            </button>
          </div>
        );
      },
    })),
    {
      clave: "estado",
      titulo: "Estado",
      celda: (donacion) => {
        const codigo = donacion.estadoEstudios?.codigo ?? "PENDIENTE";
        return (
          <StatusChip tono={codigo === "COMPLETO" ? "ok" : codigo === "EN_CARGA" ? "warn" : "neutral"}>
            {donacion.estadoEstudios?.etiqueta ?? "Pendiente de carga"}
          </StatusChip>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Posta Fija"
        subtitle="Registro de donaciones y carga de PCI y serologías en una sola pantalla."
      />

      <div className="section-tabs" role="tablist" aria-label="Secciones de Posta Fija">
        {(
          [
            ["registro", "Registro de donación"],
            ["donaciones", "Donaciones"],
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
          <RegistroDonacion
            donacionId={donacionId}
            borrador={borrador}
            onBorradorCambiado={setBorrador}
            onDonacionCreada={(id) =>
              actualizarParametros({ donacion: String(id), seccion: "donaciones", modal: null, foco: null })
            }
            onAbrirEstudios={(estudioFoco) => abrirEstudios(donacionId, estudioFoco)}
          />
        ) : null}
      </div>

      <div role="tabpanel" id="panel-donaciones" aria-labelledby="tab-donaciones" hidden={seccion !== "donaciones"}>
        {seccion === "donaciones" ? (
          <>
            <Section title="Buscar donación, DNI o ID">
              <SearchField
                label="Donación / donante"
                placeholder="Buscar donación, DNI o ID"
                value={termino}
                onChange={setTermino}
                onSubmit={() => {
                  actualizarParametros({ q: termino.trim() || null });
                  setPagina(1);
                }}
              />
            </Section>

            <Section title="Filtros">
              <div className="form-grid">
                <Field label="DNI" htmlFor="filtro-dni" ancho={3}>
                  <input
                    id="filtro-dni"
                    className="input input--data"
                    value={dni}
                    onChange={(evento) => cambiarFiltro("dni", evento.target.value)}
                    placeholder="DNI del donante"
                  />
                </Field>
                <Field label="Tipo de donación" htmlFor="filtro-tipo" ancho={3}>
                  <select
                    id="filtro-tipo"
                    className="select"
                    value={tipo}
                    onChange={(evento) => cambiarFiltro("tipo", evento.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="VOLUNTARIO">Voluntario</option>
                    <option value="REPOSICION">Reposición</option>
                  </select>
                </Field>
                <Field label="Estado de estudios" htmlFor="filtro-estado" ancho={3}>
                  <select
                    id="filtro-estado"
                    className="select"
                    value={estado}
                    onChange={(evento) => cambiarFiltro("estado", evento.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_CARGA">En carga</option>
                    <option value="COMPLETO">Completo</option>
                  </select>
                </Field>
                <Field label="DNI del paciente (reposición)" htmlFor="filtro-paciente" ancho={3}>
                  <input
                    id="filtro-paciente"
                    className="input input--data"
                    value={dniReceptor}
                    onChange={(evento) => actualizarParametros({ dniReceptor: evento.target.value || null })}
                    placeholder="DNI receptor"
                  />
                </Field>
                <Field label="Desde" htmlFor="filtro-desde" ancho={3}>
                  <input
                    id="filtro-desde"
                    className="input"
                    type="date"
                    value={desde}
                    onChange={(evento) => cambiarFiltro("desde", evento.target.value)}
                  />
                </Field>
                <Field label="Hasta" htmlFor="filtro-hasta" ancho={3}>
                  <input
                    id="filtro-hasta"
                    className="input"
                    type="date"
                    value={hasta}
                    onChange={(evento) => cambiarFiltro("hasta", evento.target.value)}
                  />
                </Field>
                <div className="field field--6 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      actualizarParametros({
                        q: null,
                        dni: null,
                        tipo: null,
                        estado: null,
                        dniReceptor: null,
                        desde: null,
                        hasta: null,
                      });
                      setTermino("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Section>

            <div id="donaciones">
              <Section title="Donaciones" description="Todas las donaciones registradas">
                <div className="tabla-donaciones">
                  <DataTable
                    columnas={columnas}
                    filas={donaciones.data?.data ?? []}
                    claveFila={(donacion) => donacion.id}
                    cargando={donaciones.isLoading}
                    error={donaciones.isError ? "No se pudo consultar el listado de donaciones." : undefined}
                    onReintentar={() => void donaciones.refetch()}
                    meta={donaciones.data?.meta}
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

      {modalAbierto ? (
        <EstudiosModal
          donacionId={donacionId}
          foco={foco}
          onCerrar={cerrarEstudios}
          onGuardarBorrador={setBorrador}
        />
      ) : null}
    </>
  );
}

function tituloEstudio(tipo: TipoEstudio): string {
  if (tipo === "PCI") return "PCI";
  return tipo === "PRIMERA" ? "Serología 1ra muestra" : "Serología 2da muestra";
}

function estadoEstudio(
  donacion: Donacion,
  tipo: TipoEstudio,
): { hecho: boolean; etiqueta: string } {
  if (tipo === "PCI") {
    const hecho = (donacion.pciDonaciones ?? []).some((item) => item.pci.resultados.length > 0);
    return { hecho, etiqueta: hecho ? "Hecho" : "Pendiente" };
  }
  const hecho = (donacion.serologiaDonaciones ?? []).some(
    (item) => item.serologia.tipoMuestra === tipo && item.serologia.resultados.length > 0,
  );
  return { hecho, etiqueta: hecho ? "Hecho" : "Pendiente" };
}

function direccionLegible(persona: Persona | null | undefined): string {
  const direccion = persona?.direccion;
  if (!direccion) return "—";
  return (
    [direccion.calle, direccion.numero, direccion.piso, direccion.departamento, direccion.ciudad?.nombre, direccion.ciudad?.provincia?.nombre]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

function lugarYFechaNacimiento(persona: Persona | null | undefined): string {
  const lugar = persona?.lugarNacimiento || persona?.direccion?.ciudad?.nombre || "—";
  return `${lugar} · ${formatoFecha(persona?.fechaNacimiento)}`;
}
