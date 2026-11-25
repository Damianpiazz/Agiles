import { useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, LoadingState } from "../components/States";
import { useHistoriaPersona } from "../hooks/useDatos";
import type {
  HistoriaDonacion,
  HistoriaEmision,
  HistoriaEstudio,
  HistoriaSolicitud,
} from "../types/datosGlobales";
import "../styles/HistoriaPersona.css";

type Props = {
  dniInicial: string;
  onVolver?: () => void;
};

const ETIQUETAS_ESTUDIO: Record<string, string> = {
  TIPIFICACION_ABO_RHD: "Tipificación ABO/RhD",
  DETECCION_ANTICUERPOS: "Detección de anticuerpos",
  PRUEBA_CRUZADA: "Prueba cruzada",
};

const COMPONENTES: Record<string, string> = {
  GLOBULOS_ROJOS: "Glóbulos rojos",
  PLASMA: "Plasma",
  PLAQUETAS: "Plaquetas",
  CRIOPRECIPITADO: "Crioprecipitado",
};

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR");
}

function fechaHora(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function grupo(abo: string, rh: string) {
  return `${abo}${rh === "POSITIVO" ? "+" : "−"}`;
}

const OPCIONES_TIPO_ESTUDIO = [
  { value: "", label: "Todos" },
  ...Object.entries(ETIQUETAS_ESTUDIO).map(([value, label]) => ({ value, label })),
];

const OPCIONES_COMPONENTE = [
  { value: "", label: "Todos" },
  ...Object.entries(COMPONENTES).map(([value, label]) => ({ value, label })),
];

function opcionesDesde<T>(
  filas: T[],
  valorDe: (fila: T) => string,
  seleccionado: string,
  etiquetas: Record<string, string> = {},
) {
  const valores = Array.from(
    new Set(filas.map((fila) => valorDe(fila)).filter(Boolean)),
  ).sort();
  if (seleccionado && !valores.includes(seleccionado)) valores.push(seleccionado);
  return [
    { value: "", label: "Todos" },
    ...valores.map((valor) => ({
      value: valor,
      label: etiquetas[valor] ?? valor.replaceAll("_", " "),
    })),
  ];
}

function opcionesAnio<T>(filas: T[], fechaDe: (fila: T) => string, seleccionado: string) {
  const anios = Array.from(
    new Set(
      filas
        .map((fila) => fechaDe(fila)?.slice(0, 4) ?? "")
        .filter((anio) => /^\d{4}$/.test(anio)),
    ),
  );
  if (seleccionado && !anios.includes(seleccionado)) anios.push(seleccionado);
  return [
    { value: "", label: "Todos" },
    ...anios.sort().map((anio) => ({ value: anio, label: anio })),
  ];
}

const columnasDonaciones: DataTableColumn<HistoriaDonacion>[] = [
  {
    id: "id",
    header: "Donación",
    render: (donacion) => <strong>#{donacion.id}</strong>,
    sortValue: (donacion) => donacion.id,
  },
  {
    id: "fecha",
    header: "Fecha y hora",
    render: (donacion) => fechaHora(donacion.fechaHora),
    sortValue: (donacion) => donacion.fechaHora,
  },
  {
    id: "estado",
    header: "Estado",
    render: (donacion) => <StatusBadge estado={donacion.estado} />,
    sortValue: (donacion) => donacion.estado,
  },
  {
    id: "unidad",
    header: "Estado de unidad",
    render: (donacion) => <StatusBadge estado={donacion.estadoUnidad} />,
    sortValue: (donacion) => donacion.estadoUnidad,
  },
  {
    id: "tipificacion",
    header: "Grupo / Factor",
    render: (donacion) => {
      const tipificacion = donacion.tipificacionesSanguineas[0];
      return tipificacion
        ? grupo(tipificacion.grupoABO, tipificacion.factorRhD)
        : "—";
    },
    sortValue: (donacion) =>
      donacion.tipificacionesSanguineas[0]
        ? `${donacion.tipificacionesSanguineas[0].grupoABO}${donacion.tipificacionesSanguineas[0].factorRhD}`
        : "",
  },
  {
    id: "eventos",
    header: "Eventos de unidad",
    render: (donacion) => donacion.eventosEstadoUnidad.length,
    sortValue: (donacion) => donacion.eventosEstadoUnidad.length,
  },
];

const columnasSolicitudes: DataTableColumn<HistoriaSolicitud>[] = [
  {
    id: "id",
    header: "Solicitud",
    render: (solicitud) => <strong>#{solicitud.id}</strong>,
    sortValue: (solicitud) => solicitud.id,
  },
  {
    id: "paciente",
    header: "Paciente",
    render: (solicitud) => solicitud.nombrePaciente,
    sortValue: (solicitud) => solicitud.nombrePaciente,
  },
  {
    id: "estado",
    header: "Estado",
    render: (solicitud) => <StatusBadge estado={solicitud.estado} />,
    sortValue: (solicitud) => solicitud.estado,
  },
  {
    id: "componente",
    header: "Componente",
    render: (solicitud) =>
      COMPONENTES[solicitud.tipoHemocomponente] ?? solicitud.tipoHemocomponente,
    sortValue: (solicitud) => solicitud.tipoHemocomponente,
  },
  {
    id: "cantidad",
    header: "Cantidad",
    render: (solicitud) => solicitud.cantidad,
    sortValue: (solicitud) => solicitud.cantidad,
  },
  {
    id: "fecha",
    header: "Fecha y hora",
    render: (solicitud) => fechaHora(solicitud.fechaHora),
    sortValue: (solicitud) => solicitud.fechaHora,
  },
  {
    id: "auditoria",
    header: "Trazabilidad",
    render: (solicitud) => `${solicitud.auditoria.length} evento(s)`,
    sortValue: (solicitud) => solicitud.auditoria.length,
  },
];

const columnasEmisiones: DataTableColumn<HistoriaEmision>[] = [
  {
    id: "id",
    header: "Emisión",
    render: (emision) => <strong>#{emision.id}</strong>,
    sortValue: (emision) => emision.id,
  },
  {
    id: "paciente",
    header: "Receptor",
    render: (emision) => emision.nombrePaciente,
    sortValue: (emision) => emision.nombrePaciente,
  },
  {
    id: "unidad",
    header: "Unidad",
    render: (emision) =>
      emision.unidadSangre?.numeroUnidad ?? emision.numeroUnidad ?? "—",
    sortValue: (emision) =>
      emision.unidadSangre?.numeroUnidad ?? emision.numeroUnidad ?? "",
  },
  {
    id: "estadoUnidad",
    header: "Estado de unidad",
    render: (emision) =>
      emision.unidadSangre?.estado ? (
        <StatusBadge estado={emision.unidadSangre.estado} />
      ) : (
        "—"
      ),
    sortValue: (emision) => emision.unidadSangre?.estado ?? "",
  },
  {
    id: "responsable",
    header: "Responsable",
    render: (emision) => emision.responsable,
    sortValue: (emision) => emision.responsable,
  },
  {
    id: "fecha",
    header: "Fecha y hora",
    render: (emision) => fechaHora(emision.fechaHora),
    sortValue: (emision) => emision.fechaHora,
  },
];

const columnasEstudios: DataTableColumn<HistoriaEstudio>[] = [
  {
    id: "tipo",
    header: "Estudio",
    render: (estudio) => (
      <strong>{ETIQUETAS_ESTUDIO[estudio.tipo] ?? estudio.tipo}</strong>
    ),
    sortValue: (estudio) => ETIQUETAS_ESTUDIO[estudio.tipo] ?? estudio.tipo,
  },
  {
    id: "resultado",
    header: "Resultado",
    render: (estudio) => estudio.resultado,
    sortValue: (estudio) => estudio.resultado,
  },
  {
    id: "compatibilidad",
    header: "Compatibilidad",
    render: (estudio) =>
      estudio.compatibilidad ? (
        <StatusBadge estado={estudio.compatibilidad} />
      ) : (
        "—"
      ),
    sortValue: (estudio) => estudio.compatibilidad ?? "",
  },
  {
    id: "unidad",
    header: "Unidad",
    render: (estudio) => estudio.unidadSangre?.numeroUnidad ?? "—",
    sortValue: (estudio) => estudio.unidadSangre?.numeroUnidad ?? "",
  },
  {
    id: "solicitud",
    header: "Solicitud",
    render: (estudio) =>
      estudio.solicitud ? `#${estudio.solicitud.id}` : "—",
    sortValue: (estudio) => estudio.solicitud?.id ?? 0,
  },
  {
    id: "operador",
    header: "Operador",
    render: (estudio) => estudio.operador,
    sortValue: (estudio) => estudio.operador,
  },
  {
    id: "fecha",
    header: "Fecha y hora",
    render: (estudio) => fechaHora(estudio.fechaHora),
    sortValue: (estudio) => estudio.fechaHora,
  },
];

export default function HistoriaPersona({ dniInicial, onVolver }: Props) {
  const [dni, setDni] = useState(dniInicial);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [filtroDonaciones, setFiltroDonaciones] = useState("");
  const [filtroSolicitudes, setFiltroSolicitudes] = useState("");
  const [filtroCompatibilidad, setFiltroCompatibilidad] = useState("");
  const [filtroEstadoUnidadDonaciones, setFiltroEstadoUnidadDonaciones] =
    useState("");
  const [filtroAnioDonaciones, setFiltroAnioDonaciones] = useState("");
  const [filtroComponenteSolicitudes, setFiltroComponenteSolicitudes] =
    useState("");
  const [filtroAnioSolicitudes, setFiltroAnioSolicitudes] = useState("");
  const [filtroEstadoUnidadEmisiones, setFiltroEstadoUnidadEmisiones] =
    useState("");
  const [filtroAnioEmisiones, setFiltroAnioEmisiones] = useState("");
  const [filtroTipoEstudio, setFiltroTipoEstudio] = useState("");
  const [filtroAnioEstudios, setFiltroAnioEstudios] = useState("");
  const { historia, cargando, error, consultar } = useHistoriaPersona(dniInicial);

  function buscar(evento: FormEvent) {
    evento.preventDefault();
    const valor = dni.trim();
    if (!/^\d{7,8}$/.test(valor)) {
      setErrorFormulario("Ingresá un DNI válido de 7 u 8 dígitos.");
      document.getElementById("historiaPersonaDni")?.focus();
      return;
    }
    setErrorFormulario("");
    void consultar(valor);
  }

  return (
    <div className="historia-persona">
      <PageHeader
        title="Historia integral de persona"
        description="Consultá, a partir de un DNI real, todos los registros de la persona como donante, paciente o receptor."
        actions={
          onVolver ? (
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={onVolver}
            >
              Volver a buscar paciente
            </button>
          ) : undefined
        }
      />

      <FormSection
        title="Buscar por DNI"
        description="El historial se arma con los datos registrados en el sistema; no se crean registros automáticamente."
      >
        <form onSubmit={buscar} noValidate>
          <FormGrid columns={2}>
            <FormField
              id="historiaPersonaDni"
              label="DNI"
              hint="7 u 8 dígitos"
              required
              error={errorFormulario}
            >
              <input
                id="historiaPersonaDni"
                inputMode="numeric"
                value={dni}
                aria-invalid={Boolean(errorFormulario)}
                onChange={(evento) => {
                  setDni(evento.target.value);
                  setErrorFormulario("");
                }}
              />
            </FormField>
          </FormGrid>
          <div className="ui-step-actions">
            <button type="submit" className="ui-btn ui-btn-primary" disabled={cargando}>
              {cargando ? "Consultando…" : "Consultar historia"}
            </button>
          </div>
        </form>
      </FormSection>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {cargando ? <LoadingState label="Consultando la historia de la persona…" /> : null}

      {historia ? (
        <>
          <FormSection title="Resumen" description="Roles y volumen de registros del DNI consultado.">
            <dl className="historia-resumen">
              <div>
                <dt>DNI</dt>
                <dd>{historia.dni}</dd>
              </div>
              <div>
                <dt>Donante</dt>
                <dd>
                  {historia.resumen.esDonante
                    ? historia.resumen.donanteActivo
                      ? "Activo"
                      : "De baja"
                    : "No registrado"}
                </dd>
              </div>
              <div>
                <dt>Paciente / receptor</dt>
                <dd>{historia.resumen.esPaciente ? "Registrado" : "No registrado"}</dd>
              </div>
              <div>
                <dt>Donaciones</dt>
                <dd>{historia.resumen.totalDonaciones}</dd>
              </div>
              <div>
                <dt>Solicitudes</dt>
                <dd>{historia.resumen.totalSolicitudes}</dd>
              </div>
              <div>
                <dt>Emisiones</dt>
                <dd>{historia.resumen.totalEmisiones}</dd>
              </div>
              <div>
                <dt>Estudios pretransfusionales</dt>
                <dd>{historia.resumen.totalEstudios}</dd>
              </div>
            </dl>
          </FormSection>

          <FormSection title="Identidad registrada" description="Datos que constan en el sistema para este DNI.">
            <div className="historia-identidad">
              {historia.donante ? (
                <dl>
                  <dt>Donante</dt>
                  <dd>
                    {historia.donante.nombre} {historia.donante.apellido}
                  </dd>
                  <dt>Fecha de nacimiento</dt>
                  <dd>{fecha(historia.donante.fechaNacimiento)}</dd>
                  <dt>Alta</dt>
                  <dd>{fechaHora(historia.donante.createdAt)}</dd>
                </dl>
              ) : (
                <p className="historia-sin-rol">No figura como donante.</p>
              )}
              {historia.paciente ? (
                <dl>
                  <dt>Paciente</dt>
                  <dd>
                    {historia.paciente.nombre} {historia.paciente.apellido}
                  </dd>
                  <dt>Fecha de nacimiento</dt>
                  <dd>{fecha(historia.paciente.fechaNacimiento)}</dd>
                  <dt>Operador de alta</dt>
                  <dd>{historia.paciente.operador}</dd>
                </dl>
              ) : (
                <p className="historia-sin-rol">No figura en el padrón de pacientes.</p>
              )}
            </div>
          </FormSection>

          <FormSection title="Donaciones" description="Donaciones vinculadas al donante con este DNI.">
            <DataTable
              rows={historia.donaciones}
              columns={columnasDonaciones}
              rowKey={(donacion) => donacion.id}
              searchText={(donacion) =>
                `${donacion.id} ${donacion.estado} ${donacion.estadoUnidad} ${donacion.operador} ${donacion.observaciones ?? ""}`
              }
              searchPlaceholder="Buscar donaciones…"
              filters={[
                {
                  id: "estadoDonacion",
                  label: "Estado",
                  value: filtroDonaciones,
                  options: [
                    { value: "", label: "Todos" },
                    { value: "REGISTRADA", label: "Registrada" },
                    { value: "EN_CALIFICACION", label: "En calificación" },
                    { value: "CALIFICADA", label: "Calificada" },
                    { value: "RECHAZADA", label: "Rechazada" },
                  ],
                  onChange: setFiltroDonaciones,
                },
                {
                  id: "estadoUnidadDonaciones",
                  label: "Estado de unidad",
                  value: filtroEstadoUnidadDonaciones,
                  options: opcionesDesde(
                    historia.donaciones,
                    (donacion) => donacion.estadoUnidad,
                    filtroEstadoUnidadDonaciones,
                  ),
                  onChange: setFiltroEstadoUnidadDonaciones,
                },
                {
                  id: "anioDonaciones",
                  label: "Año",
                  value: filtroAnioDonaciones,
                  options: opcionesAnio(
                    historia.donaciones,
                    (donacion) => donacion.fechaHora,
                    filtroAnioDonaciones,
                  ),
                  onChange: setFiltroAnioDonaciones,
                },
              ]}
              filterRow={(donacion) =>
                (!filtroDonaciones || donacion.estado === filtroDonaciones) &&
                (!filtroEstadoUnidadDonaciones ||
                  donacion.estadoUnidad === filtroEstadoUnidadDonaciones) &&
                (!filtroAnioDonaciones ||
                  donacion.fechaHora.startsWith(filtroAnioDonaciones))
              }
              emptyTitle="Sin donaciones registradas"
              emptyDescription="Este DNI no tiene donaciones asociadas."
              caption="Donaciones del donante consultado."
            />
          </FormSection>

          <FormSection title="Solicitudes de transfusión" description="Pedidos donde la persona figura como paciente o receptor.">
            <DataTable
              rows={historia.solicitudes}
              columns={columnasSolicitudes}
              rowKey={(solicitud) => solicitud.id}
              searchText={(solicitud) =>
                `${solicitud.id} ${solicitud.nombrePaciente} ${solicitud.dniPaciente} ${solicitud.tipoHemocomponente} ${solicitud.operador}`
              }
              searchPlaceholder="Buscar solicitudes…"
              filters={[
                {
                  id: "estadoSolicitud",
                  label: "Estado",
                  value: filtroSolicitudes,
                  options: [
                    { value: "", label: "Todos" },
                    { value: "PENDIENTE", label: "Pendiente" },
                    { value: "APROBADA", label: "Aprobada" },
                    { value: "CANCELADA", label: "Cancelada" },
                  ],
                  onChange: setFiltroSolicitudes,
                },
                {
                  id: "componenteSolicitudes",
                  label: "Componente",
                  value: filtroComponenteSolicitudes,
                  options: OPCIONES_COMPONENTE,
                  onChange: setFiltroComponenteSolicitudes,
                },
                {
                  id: "anioSolicitudes",
                  label: "Año",
                  value: filtroAnioSolicitudes,
                  options: opcionesAnio(
                    historia.solicitudes,
                    (solicitud) => solicitud.fechaHora,
                    filtroAnioSolicitudes,
                  ),
                  onChange: setFiltroAnioSolicitudes,
                },
              ]}
              filterRow={(solicitud) =>
                (!filtroSolicitudes || solicitud.estado === filtroSolicitudes) &&
                (!filtroComponenteSolicitudes ||
                  solicitud.tipoHemocomponente === filtroComponenteSolicitudes) &&
                (!filtroAnioSolicitudes ||
                  solicitud.fechaHora.startsWith(filtroAnioSolicitudes))
              }
              emptyTitle="Sin solicitudes registradas"
              emptyDescription="Este DNI no tiene solicitudes de transfusión asociadas."
              caption="Solicitudes de transfusión de la persona consultada."
            />
          </FormSection>

          <FormSection title="Emisiones de sangre" description="Unidades emitidas para este receptor.">
            <DataTable
              rows={historia.emisiones}
              columns={columnasEmisiones}
              rowKey={(emision) => emision.id}
              searchText={(emision) =>
                `${emision.id} ${emision.nombrePaciente} ${emision.responsable} ${emision.numeroUnidad}`
              }
              searchPlaceholder="Buscar emisiones…"
              filters={[
                {
                  id: "estadoUnidadEmisiones",
                  label: "Estado de unidad",
                  value: filtroEstadoUnidadEmisiones,
                  options: opcionesDesde(
                    historia.emisiones,
                    (emision) => emision.unidadSangre?.estado ?? "",
                    filtroEstadoUnidadEmisiones,
                  ),
                  onChange: setFiltroEstadoUnidadEmisiones,
                },
                {
                  id: "anioEmisiones",
                  label: "Año",
                  value: filtroAnioEmisiones,
                  options: opcionesAnio(
                    historia.emisiones,
                    (emision) => emision.fechaHora,
                    filtroAnioEmisiones,
                  ),
                  onChange: setFiltroAnioEmisiones,
                },
              ]}
              filterRow={(emision) =>
                (!filtroEstadoUnidadEmisiones ||
                  (emision.unidadSangre?.estado ?? "") ===
                    filtroEstadoUnidadEmisiones) &&
                (!filtroAnioEmisiones ||
                  emision.fechaHora.startsWith(filtroAnioEmisiones))
              }
              emptyTitle="Sin emisiones registradas"
              emptyDescription="No hay unidades emitidas para este DNI."
              caption="Emisiones registradas para la persona consultada."
            />
          </FormSection>

          <FormSection title="Estudios pretransfusionales" description="Resultados registrados en las solicitudes del receptor.">
            <DataTable
              rows={historia.estudios}
              columns={columnasEstudios}
              rowKey={(estudio) => estudio.id}
              searchText={(estudio) =>
                `${estudio.tipo} ${estudio.resultado} ${estudio.operador} ${estudio.unidadSangre?.numeroUnidad ?? ""}`
              }
              searchPlaceholder="Buscar estudios…"
              filters={[
                {
                  id: "compatibilidad",
                  label: "Compatibilidad",
                  value: filtroCompatibilidad,
                  options: [
                    { value: "", label: "Todas" },
                    { value: "COMPATIBLE", label: "Compatible" },
                    { value: "INCOMPATIBLE", label: "Incompatible" },
                  ],
                  onChange: setFiltroCompatibilidad,
                },
                {
                  id: "tipoEstudio",
                  label: "Estudio",
                  value: filtroTipoEstudio,
                  options: OPCIONES_TIPO_ESTUDIO,
                  onChange: setFiltroTipoEstudio,
                },
                {
                  id: "anioEstudios",
                  label: "Año",
                  value: filtroAnioEstudios,
                  options: opcionesAnio(
                    historia.estudios,
                    (estudio) => estudio.fechaHora,
                    filtroAnioEstudios,
                  ),
                  onChange: setFiltroAnioEstudios,
                },
              ]}
              filterRow={(estudio) =>
                (!filtroCompatibilidad ||
                  estudio.compatibilidad === filtroCompatibilidad) &&
                (!filtroTipoEstudio || estudio.tipo === filtroTipoEstudio) &&
                (!filtroAnioEstudios ||
                  estudio.fechaHora.startsWith(filtroAnioEstudios))
              }
              emptyTitle="Sin estudios pretransfusionales"
              emptyDescription="No hay estudios registrados para las solicitudes de este DNI."
              caption="Estudios pretransfusionales de la persona consultada."
            />
          </FormSection>
        </>
      ) : !cargando && !error ? (
        <EmptyState
          title="Ingresá un DNI para consultar"
          description="La historia integral se compone con donaciones, solicitudes, emisiones y estudios existentes."
        />
      ) : null}
    </div>
  );
}
