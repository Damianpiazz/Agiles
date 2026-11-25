import { useState } from "react";
import type { ReactNode } from "react";
import { Banner } from "../components/Banner";
import { BarrasApiladas, BarrasHorizontales, GraficoLineas } from "../components/dashboard/Charts";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, LoadingState } from "../components/States";
import { useDashboard } from "../hooks/useDashboard";
import {
  COMPONENTES,
  ESTADOS,
  GRUPOS,
  PERIODOS,
} from "../types/dashboard";
import type {
  ActividadTransfusion,
  Alerta,
  Conteo,
  DonacionPendiente,
  EventoActividad,
  FiltrosDashboard,
  SolicitudReciente,
  UnidadVencimiento,
} from "../types/dashboard";
import type { Vista } from "../types/navigation";
import "../styles/Dashboard.css";

const VISTAS_VALIDAS = new Set<Vista>([
  "dashboard",
  "alta",
  "paciente",
  "buscarPaciente",
  "historiaPersona",
  "buscar",
  "donacion",
  "estudios",
  "calificacion",
  "tipificacion",
  "tamizaje",
  "seleccionar",
  "emision",
  "liberacion",
  "recepcion",
  "baja",
  "solicitudesTransfusion",
  "estudiosPretransfusionales",
  "consultaResultados",
]);

const ETIQUETAS_COMPONENTE: Record<string, string> = {
  GLOBULOS_ROJOS: "Glóbulos rojos",
  PLASMA: "Plasma",
  PLAQUETAS: "Plaquetas",
  CRIOPRECIPITADO: "Crioprecipitados",
};

const ETIQUETAS_ESTADO_UNIDAD: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  BLOQUEADA: "Bloqueada",
  EMITIDA: "Emitida",
  VENCIDA: "Vencida",
  DADA_DE_BAJA: "Dada de baja",
};

const ETIQUETAS_ESTADO_DONACION: Record<string, string> = {
  REGISTRADA: "Registrada",
  EN_CALIFICACION: "En calificación",
  CALIFICADA: "Calificada",
  RECHAZADA: "Rechazada",
};

const ETIQUETAS_ESTADO_SOLICITUD: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  CANCELADA: "Cancelada",
};

const ETIQUETAS_CALIFICACION: Record<string, string> = {
  INICIADA: "Iniciada",
  SIN_INICIO: "Sin inicio",
};

const SERIES_INVENTARIO = [
  { key: "disponible", label: "Disponible", color: "#18794e" },
  { key: "reservada", label: "Reservada", color: "#9b1c31" },
  { key: "bloqueada", label: "Bloqueada", color: "#946200" },
];

const SERIE_ACTIVIDAD = [
  { key: "cantidad", label: "Registros", color: "#9b1c31" },
];

const SERIES_MOVIMIENTOS = [
  { key: "entradas", label: "Entradas", color: "#18794e" },
  { key: "salidas", label: "Salidas", color: "#b42332" },
  { key: "emitidas", label: "Emitidas", color: "#1f5f9e" },
];

function esVista(valor: string): valor is Vista {
  return VISTAS_VALIDAS.has(valor as Vista);
}

function formatearFecha(iso: string, conHora = false): string {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [anio, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  const opciones: Intl.DateTimeFormatOptions = conHora
    ? { dateStyle: "short", timeStyle: "short" }
    : { dateStyle: "short" };
  return new Intl.DateTimeFormat("es-AR", opciones).format(fecha);
}

function formatearHora(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(fecha);
}

function scrollA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Panel({
  id,
  titulo,
  descripcion,
  children,
  variant,
}: {
  id: string;
  titulo: string;
  descripcion: string;
  children: ReactNode;
  variant?: "alertas";
}) {
  return (
    <section
      className={variant === "alertas" ? "dash-panel dash-panel-alertas" : "dash-panel"}
      id={id}
    >
      <header className="dash-panel-header">
        <div>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function MetricStrip({
  items,
}: {
  items: { etiqueta: string; valor: number; nota?: string; onClick?: () => void }[];
}) {
  return (
    <div className="dash-metric-strip">
      {items.map((item) => {
        const contenido = (
          <>
            <strong>{item.valor}</strong>
            <span>{item.etiqueta}</span>
            {item.nota ? <small>{item.nota}</small> : null}
          </>
        );
        return item.onClick ? (
          <button
            key={item.etiqueta}
            type="button"
            className="dash-metric is-clickable"
            onClick={item.onClick}
          >
            {contenido}
          </button>
        ) : (
          <div className="dash-metric" key={item.etiqueta}>
            {contenido}
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({
  titulo,
  valor,
  descripcion,
  icono,
  variacion,
  onOpen,
  onModule,
}: {
  titulo: string;
  valor: number;
  descripcion: string;
  icono: string;
  variacion?: { actual: number; anterior: number };
  onOpen: () => void;
  onModule: () => void;
}) {
  const diferencia = variacion ? variacion.actual - variacion.anterior : null;
  return (
    <article className="dash-kpi">
      <button type="button" className="dash-kpi-main" onClick={onOpen}>
        <span className="dash-kpi-top">
          <span className="dash-kpi-title">{titulo}</span>
          <span className="dash-kpi-icon" aria-hidden="true">
            {icono}
          </span>
        </span>
        <strong className="dash-kpi-value">{valor}</strong>
        <span className="dash-kpi-description">{descripcion}</span>
        {diferencia !== null && (variacion?.anterior ?? 0) > 0 ? (
          <span
            className={`dash-kpi-trend ${diferencia >= 0 ? "is-up" : "is-down"}`}
          >
            {diferencia >= 0 ? "↑ +" : "↓ "}
            {diferencia} vs. período anterior
          </span>
        ) : null}
      </button>
      <button type="button" className="dash-kpi-module" onClick={onModule}>
        Abrir módulo <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

function EtiquetaEstado({ estado, tipo }: { estado: string; tipo: "unidad" | "donacion" | "solicitud" }) {
  const mapa =
    tipo === "unidad"
      ? ETIQUETAS_ESTADO_UNIDAD
      : tipo === "donacion"
        ? ETIQUETAS_ESTADO_DONACION
        : ETIQUETAS_ESTADO_SOLICITUD;
  const texto = mapa[estado] ?? estado;
  return (
    <span className={`dash-badge dash-badge-${estado.toLowerCase()}`}>
      <span aria-hidden="true">•</span> {texto}
    </span>
  );
}

export default function Dashboard({
  onNavigate,
}: {
  onNavigate: (vista: Vista) => void;
}) {
  const {
    filtros,
    datos,
    cargando,
    error,
    actualizadoEn,
    rango,
    actualizarFiltros,
    limpiarFiltros,
    recargar,
    verDia,
  } = useDashboard();
  const [rangoVencimiento, setRangoVencimiento] = useState("todos");
  const [filtroCalificacion, setFiltroCalificacion] = useState("");
  const [filtroDonacion, setFiltroDonacion] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");

  function ir(vista: string) {
    if (esVista(vista)) onNavigate(vista);
  }

  function aplicarFiltro(cambios: Partial<FiltrosDashboard>, seccion?: string) {
    actualizarFiltros(cambios);
    if (seccion) scrollA(seccion);
  }

  const alertas = datos?.alertas ?? [];
  const alertasVisibles = filtroPrioridad
    ? alertas.filter((alerta) => alerta.prioridad === filtroPrioridad)
    : alertas;

  const columnasVencimientos: DataTableColumn<UnidadVencimiento>[] = [
    {
      id: "unidad",
      header: "Unidad",
      render: (fila) => <strong>{fila.numeroUnidad}</strong>,
      sortValue: (fila) => fila.numeroUnidad,
    },
    {
      id: "tipo",
      header: "Hemocomponente",
      render: (fila) => ETIQUETAS_COMPONENTE[fila.tipo] ?? fila.tipo,
      sortValue: (fila) => fila.tipo,
    },
    { id: "grupo", header: "Grupo", render: (fila) => fila.grupo },
    {
      id: "vencimiento",
      header: "Vencimiento",
      render: (fila) => formatearFecha(fila.fechaVencimiento),
      sortValue: (fila) => fila.fechaVencimiento,
    },
    {
      id: "estado",
      header: "Estado",
      render: (fila) => <EtiquetaEstado estado={fila.estado} tipo="unidad" />,
      sortValue: (fila) => fila.estado,
    },
    {
      id: "dias",
      header: "Días restantes",
      render: (fila) =>
        fila.diasRestantes < 0
          ? `Vencido hace ${Math.abs(fila.diasRestantes)} d`
          : fila.diasRestantes === 0
            ? "Vence hoy"
            : `${fila.diasRestantes} días`,
      sortValue: (fila) => fila.diasRestantes,
    },
    {
      id: "accion",
      header: "Acción",
      render: (fila) => (
        <button
          type="button"
          className="ui-btn ui-btn-small ui-btn-secondary"
          onClick={() =>
            ir(fila.estado === "VENCIDA" || fila.estado === "BLOQUEADA" ? "baja" : "recepcion")
          }
        >
          Consultar
        </button>
      ),
    },
  ];

  const columnasDonaciones: DataTableColumn<DonacionPendiente>[] = [
    {
      id: "donante",
      header: "Donante",
      render: (fila) => (
        <>
          <strong>{fila.donante}</strong>
          <small className="dash-cell-secondary">DNI {fila.dni}</small>
        </>
      ),
      sortValue: (fila) => fila.donante,
    },
    {
      id: "donacion",
      header: "Donación",
      render: (fila) => `#${fila.id}`,
      sortValue: (fila) => fila.id,
    },
    {
      id: "fecha",
      header: "Fecha",
      render: (fila) => formatearFecha(fila.fecha, true),
      sortValue: (fila) => fila.fecha,
    },
    {
      id: "estado",
      header: "Estado",
      render: (fila) => <EtiquetaEstado estado={fila.estado} tipo="donacion" />,
      sortValue: (fila) => fila.estado,
    },
    {
      id: "calificacion",
      header: "Calificación",
      render: (fila) =>
        ETIQUETAS_CALIFICACION[fila.calificacion ?? "SIN_INICIO"] ??
        fila.calificacion ??
        "—",
      sortValue: (fila) => fila.calificacion ?? "",
    },
    {
      id: "alerta",
      header: "Situación",
      render: (fila) =>
        fila.discrepancia || fila.anticuerpo === "POSITIVO" ? (
          <span className="dash-flag">Requiere revisión</span>
        ) : (
          <span className="dash-muted">Sin observaciones</span>
        ),
    },
    {
      id: "accion",
      header: "Acción",
      render: (fila) => (
        <button
          type="button"
          className="ui-btn ui-btn-small ui-btn-secondary"
          onClick={() =>
            ir(
              fila.discrepancia || fila.anticuerpo === "POSITIVO"
                ? "consultaResultados"
                : "calificacion",
            )
          }
        >
          Consultar
        </button>
      ),
    },
  ];

  const columnasSolicitudes: DataTableColumn<SolicitudReciente>[] = [
    {
      id: "id",
      header: "Solicitud",
      render: (fila) => <strong>#{fila.id}</strong>,
      sortValue: (fila) => fila.id,
    },
    {
      id: "paciente",
      header: "Paciente",
      render: (fila) => fila.paciente,
      sortValue: (fila) => fila.paciente,
    },
    {
      id: "fecha",
      header: "Fecha",
      render: (fila) => formatearFecha(fila.fecha, true),
      sortValue: (fila) => fila.fecha,
    },
    {
      id: "tipo",
      header: "Hemocomponente",
      render: (fila) => ETIQUETAS_COMPONENTE[fila.tipo] ?? fila.tipo,
      sortValue: (fila) => fila.tipo,
    },
    {
      id: "cantidad",
      header: "Cantidad",
      render: (fila) => fila.cantidad,
      sortValue: (fila) => fila.cantidad,
    },
    {
      id: "estado",
      header: "Estado",
      render: (fila) => <EtiquetaEstado estado={fila.estado} tipo="solicitud" />,
      sortValue: (fila) => fila.estado,
    },
    {
      id: "accion",
      header: "Acción",
      render: () => (
        <button
          type="button"
          className="ui-btn ui-btn-small ui-btn-secondary"
          onClick={() => ir("solicitudesTransfusion")}
        >
          Consultar
        </button>
      ),
    },
  ];

  const columnasTransfusiones: DataTableColumn<ActividadTransfusion>[] = [
    {
      id: "paciente",
      header: "Paciente",
      render: (fila) => fila.paciente,
      sortValue: (fila) => fila.paciente,
    },
    {
      id: "solicitud",
      header: "Solicitud",
      render: (fila) => `#${fila.solicitudId}`,
      sortValue: (fila) => fila.solicitudId,
    },
    {
      id: "unidad",
      header: "Unidad",
      render: (fila) => fila.numeroUnidad,
      sortValue: (fila) => fila.numeroUnidad,
    },
    {
      id: "tipo",
      header: "Hemocomponente",
      render: (fila) => ETIQUETAS_COMPONENTE[fila.tipo] ?? fila.tipo,
      sortValue: (fila) => fila.tipo,
    },
    {
      id: "estado",
      header: "Estado de unidad",
      render: (fila) => <EtiquetaEstado estado={fila.estadoUnidad} tipo="unidad" />,
      sortValue: (fila) => fila.estadoUnidad,
    },
    {
      id: "fecha",
      header: "Fecha",
      render: (fila) => formatearFecha(fila.fecha, true),
      sortValue: (fila) => fila.fecha,
    },
    {
      id: "responsable",
      header: "Responsable",
      render: (fila) => fila.responsable || "—",
      sortValue: (fila) => fila.responsable,
    },
    {
      id: "accion",
      header: "Acción",
      render: () => (
        <button
          type="button"
          className="ui-btn ui-btn-small ui-btn-secondary"
          onClick={() => ir("emision")}
        >
          Consultar
        </button>
      ),
    },
  ];

  const hayFiltros =
    Boolean(filtros.componente) || Boolean(filtros.grupo) || Boolean(filtros.estado) ||
    filtros.periodo !== "30d";

  return (
    <div className="dashboard">
      <PageHeader
        eyebrow="Centro de control operativo"
        title="Resumen operativo"
        description="Estado actual del inventario y actividad registrada en el período seleccionado."
        actions={
          <>
            <span className="dash-updated" aria-live="polite">
              <span className="dash-updated-dot" aria-hidden="true" />
              Actualizado {formatearHora(actualizadoEn)}
            </span>
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={recargar}
              disabled={cargando}
              aria-busy={cargando}
            >
              ↻ Actualizar
            </button>
          </>
        }
      />

      <section className="dash-filters" aria-label="Filtros globales del dashboard">
        <div className="dash-filters-grid">
          <label>
            <span>Período</span>
            <select
              value={filtros.periodo}
              onChange={(evento) =>
                actualizarFiltros({
                  periodo: evento.target.value as FiltrosDashboard["periodo"],
                })
              }
            >
              {PERIODOS.map((periodo) => (
                <option key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </option>
              ))}
            </select>
          </label>
          {filtros.periodo === "personalizado" ? (
            <>
              <label>
                <span>Desde</span>
                <input
                  type="date"
                  value={filtros.desde}
                  max={filtros.hasta}
                  onChange={(evento) =>
                    actualizarFiltros({ desde: evento.target.value })
                  }
                />
              </label>
              <label>
                <span>Hasta</span>
                <input
                  type="date"
                  value={filtros.hasta}
                  min={filtros.desde}
                  onChange={(evento) =>
                    actualizarFiltros({ hasta: evento.target.value })
                  }
                />
              </label>
            </>
          ) : null}
          <label>
            <span>Hemocomponente</span>
            <select
              value={filtros.componente}
              onChange={(evento) =>
                actualizarFiltros({ componente: evento.target.value })
              }
            >
              {COMPONENTES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Grupo sanguíneo</span>
            <select
              value={filtros.grupo}
              onChange={(evento) => actualizarFiltros({ grupo: evento.target.value })}
            >
              {GRUPOS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Estado</span>
            <select
              value={filtros.estado}
              onChange={(evento) => actualizarFiltros({ estado: evento.target.value })}
            >
              {ESTADOS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ui-btn ui-btn-secondary dash-clean-button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
          >
            Limpiar filtros
          </button>
        </div>
        <p className="dash-filters-note">
          Período: {formatearFecha(rango.desde)} – {formatearFecha(rango.hasta)} ·
          El inventario muestra el estado actual; la actividad respeta el período.
          El estado se aplica al módulo indicado en la opción elegida.
        </p>
      </section>

      {error ? (
        <Banner tone="error">
          {error}. Revisá la conexión con la API e intentá actualizar nuevamente.
        </Banner>
      ) : null}

      {cargando && !datos ? (
        <LoadingState label="Consultando el snapshot operativo…" />
      ) : !datos ? null : (
        <>
          <section className="dash-kpis" aria-label="Indicadores principales">
            <KpiCard
              titulo="Unidades disponibles"
              valor={datos.kpis.unidadesDisponibles}
              descripcion="Stock actual apto según el sistema"
              icono="◉"
              onOpen={() =>
                aplicarFiltro(
                  { estado: "unidades:DISPONIBLE" },
                  "dashboard-inventario",
                )
              }
              onModule={() => ir("recepcion")}
            />
            <KpiCard
              titulo="Calificaciones pendientes"
              valor={datos.kpis.calificacionesPendientes}
              descripcion="Donaciones activas sin calificación iniciada"
              icono="✓"
              onOpen={() => {
                setFiltroCalificacion("SIN_INICIO");
                scrollA("dashboard-donaciones");
              }}
              onModule={() => ir("calificacion")}
            />
            <KpiCard
              titulo="Solicitudes pendientes"
              valor={datos.kpis.solicitudesPendientes}
              descripcion="Requieren gestión del servicio"
              icono="▤"
              onOpen={() =>
                aplicarFiltro(
                  { estado: "solicitudes:PENDIENTE" },
                  "dashboard-solicitudes",
                )
              }
              onModule={() => ir("solicitudesTransfusion")}
            />
            <KpiCard
              titulo="Próximas a vencer"
              valor={datos.kpis.unidadesProximasVencer}
              descripcion="Unidades con vencimiento en 30 días"
              icono="◷"
              onOpen={() => {
                setRangoVencimiento("30");
                scrollA("dashboard-vencimientos");
              }}
              onModule={() => ir("recepcion")}
            />
            <KpiCard
              titulo="Donaciones del período"
              valor={datos.kpis.donacionesPeriodo}
              descripcion="Registros en el rango seleccionado"
              icono="♥"
              variacion={{
                actual: datos.kpis.donacionesPeriodo,
                anterior: datos.comparativos.donacionesAnterior,
              }}
              onOpen={() => scrollA("dashboard-donaciones")}
              onModule={() => ir("donacion")}
            />
            <KpiCard
              titulo="Unidades emitidas"
              valor={datos.kpis.unidadesEmitidas}
              descripcion="Emitidas; no equivalen a transfusiones finalizadas"
              icono="↗"
              onOpen={() =>
                aplicarFiltro({ estado: "unidades:EMITIDA" }, "dashboard-inventario")
              }
              onModule={() => ir("emision")}
            />
          </section>

          <Panel
            id="dashboard-inventario"
            titulo="Inventario de hemocomponentes"
            descripcion="Existencias actuales por componente, grupo y estado. Las reservas y unidades bloqueadas no se contabilizan como disponibles."
          >
            <MetricStrip
              items={[
                {
                  etiqueta: "Disponibles",
                  valor: datos.inventario.totales.disponible,
                  onClick: () =>
                    aplicarFiltro({ estado: "unidades:DISPONIBLE" }, "dashboard-inventario"),
                },
                {
                  etiqueta: "Reservadas",
                  valor: datos.inventario.totales.reservada,
                  onClick: () =>
                    aplicarFiltro({ estado: "unidades:RESERVADA" }, "dashboard-inventario"),
                },
                {
                  etiqueta: "Bloqueadas",
                  valor: datos.inventario.totales.bloqueada,
                  onClick: () =>
                    aplicarFiltro({ estado: "unidades:BLOQUEADA" }, "dashboard-inventario"),
                },
                {
                  etiqueta: "Emitidas",
                  valor: datos.inventario.totales.emitida,
                  onClick: () =>
                    aplicarFiltro({ estado: "unidades:EMITIDA" }, "dashboard-inventario"),
                },
                { etiqueta: "Vencidas", valor: datos.inventario.totales.vencida },
                {
                  etiqueta: "Dadas de baja",
                  valor: datos.inventario.totales.dadaDeBaja,
                },
                {
                  etiqueta: "Próximas a vencer",
                  valor: datos.inventario.totales.proximasVencer,
                },
              ]}
            />
            <div className="dash-charts-grid">
              <article className="dash-chart-card">
                <h3>Stock por hemocomponente</h3>
                <BarrasApiladas
                  titulo="Stock por hemocomponente"
                  datos={datos.inventario.porComponente.map((fila) => ({
                    label: fila.tipo,
                    valores: {
                      disponible: fila.disponible,
                      reservada: fila.reservada,
                      bloqueada: fila.bloqueada,
                    },
                  }))}
                  series={SERIES_INVENTARIO}
                  formatearEtiqueta={(valor) => ETIQUETAS_COMPONENTE[valor] ?? valor}
                  onSelect={(valor) => {
                    actualizarFiltros({ componente: valor });
                    scrollA("dashboard-vencimientos");
                  }}
                />
                <p className="dash-chart-hint">
                  Click en una barra → filtra el inventario por ese hemocomponente.
                </p>
              </article>
              <article className="dash-chart-card">
                <h3>Unidades disponibles por grupo ABO/RhD</h3>
                <BarrasHorizontales
                  titulo="Unidades disponibles por grupo sanguíneo"
                  datos={datos.inventario.porGrupo as Conteo[]}
                  onSelect={(valor) => {
                    actualizarFiltros({ grupo: valor });
                    scrollA("dashboard-vencimientos");
                  }}
                />
              </article>
              <article className="dash-chart-card">
                <h3>Estado del inventario</h3>
                <BarrasHorizontales
                  titulo="Distribución del inventario por estado"
                  datos={datos.inventario.porEstado.map((fila) => ({
                    label: fila.label,
                    value: fila.value,
                  }))}
                  color="#9b1c31"
                  formatearEtiqueta={(valor) => ETIQUETAS_ESTADO_UNIDAD[valor] ?? valor}
                  onSelect={(valor) => {
                    actualizarFiltros({ estado: `unidades:${valor}` });
                    scrollA("dashboard-vencimientos");
                  }}
                />
              </article>
              <article className="dash-chart-card">
                <h3>Evolución de movimientos del período</h3>
                <GraficoLineas
                  titulo="Entradas, salidas y emisiones de unidades"
                  datos={datos.inventario.evolucion}
                  series={SERIES_MOVIMIENTOS}
                  onSelect={verDia}
                />
              </article>
            </div>
            <div className="dash-table-block" id="dashboard-vencimientos">
              <h3>Vencimientos y estado de unidades</h3>
              <DataTable
                rows={datos.inventario.vencimientos}
                columns={columnasVencimientos}
                rowKey={(fila) => fila.id}
                searchText={(fila) =>
                  `${fila.numeroUnidad} ${fila.tipo} ${fila.grupo} ${fila.estado}`
                }
                searchPlaceholder="Buscar unidad, tipo o grupo…"
                filters={[
                  {
                    id: "rangoVencimiento",
                    label: "Rango de vencimiento",
                    value: rangoVencimiento,
                    options: [
                      { value: "todos", label: "Todos" },
                      { value: "7", label: "Próximos 7 días" },
                      { value: "15", label: "Próximos 15 días" },
                      { value: "30", label: "Próximos 30 días" },
                    ],
                    onChange: setRangoVencimiento,
                  },
                ]}
                filterRow={(fila) =>
                  rangoVencimiento === "todos" ||
                  (fila.diasRestantes >= 0 &&
                    fila.diasRestantes <= Number(rangoVencimiento))
                }
                emptyTitle="No hay unidades en el rango seleccionado"
                emptyDescription="Cuando se registren unidades próximas a vencer aparecerán en esta tabla."
                caption="Unidades próximas a vencer o ya vencidas, según el estado registrado."
              />
            </div>
          </Panel>

          <Panel
            id="dashboard-donaciones"
            titulo="Donaciones y calificación biológica"
            descripcion="Los totales por estado son acumulados; la evolución respeta el período. Las etapas se muestran sólo cuando el sistema registra la actividad correspondiente."
          >
            <MetricStrip
              items={[
                { etiqueta: "Donaciones del período", valor: datos.donaciones.totales.periodo },
                { etiqueta: "Registradas", valor: datos.donaciones.totales.registradas },
                { etiqueta: "En calificación", valor: datos.donaciones.totales.enCalificacion },
                { etiqueta: "Calificadas", valor: datos.donaciones.totales.calificadas },
                { etiqueta: "Rechazadas", valor: datos.donaciones.totales.rechazadas },
                {
                  etiqueta: "Calificaciones iniciadas",
                  valor: datos.donaciones.totales.calificacionesIniciadas,
                },
                {
                  etiqueta: "Sin calificación",
                  valor: datos.donaciones.totales.sinCalificacion,
                },
                {
                  etiqueta: "Pendientes de liberación",
                  valor: datos.donaciones.totales.pendientesLiberacion,
                },
              ]}
            />
            <div className="dash-charts-grid">
              <article className="dash-chart-card">
                <h3>Evolución de donaciones</h3>
                <GraficoLineas
                  titulo="Donaciones por día en el período"
                  datos={datos.donaciones.evolucion}
                  series={SERIE_ACTIVIDAD}
                  onSelect={verDia}
                />
                <p className="dash-chart-hint">Click en un día → filtra el período a esa fecha.</p>
              </article>
              <article className="dash-chart-card">
                <h3>Estado de las calificaciones</h3>
                <BarrasHorizontales
                  titulo="Estado de calificación biológica"
                  datos={datos.donaciones.estadosCalificacion}
                  formatearEtiqueta={(valor) => ETIQUETAS_CALIFICACION[valor] ?? valor}
                  onSelect={(valor) => {
                    setFiltroCalificacion(valor);
                    scrollA("dashboard-donaciones-pendientes");
                  }}
                />
              </article>
              <article className="dash-chart-card dash-chart-card-wide">
                <h3>Flujo operativo de calificación</h3>
                <BarrasHorizontales
                  titulo="Etapas registradas del circuito de donación"
                  datos={datos.donaciones.flujo}
                  color="#7d1628"
                />
                <p className="dash-chart-hint">
                  Conteos acumulados de los registros existentes; las unidades bloqueadas nunca se presentan como disponibles.
                </p>
              </article>
            </div>
            <div className="dash-table-block" id="dashboard-donaciones-pendientes">
              <h3>Donaciones pendientes y resultados a revisar</h3>
              <DataTable
                rows={datos.donaciones.pendientes}
                columns={columnasDonaciones}
                rowKey={(fila) => fila.id}
                searchText={(fila) => `${fila.donante} ${fila.dni} ${fila.id}`}
                searchPlaceholder="Buscar donante, DNI o número de donación…"
                filters={[
                  {
                    id: "calificacion",
                    label: "Calificación",
                    value: filtroCalificacion,
                    options: [
                      { value: "", label: "Todas" },
                      { value: "SIN_INICIO", label: "Sin inicio" },
                      { value: "INICIADA", label: "Iniciada" },
                    ],
                    onChange: setFiltroCalificacion,
                  },
                  {
                    id: "estadoDonacion",
                    label: "Estado de donación",
                    value: filtroDonacion,
                    options: [
                      { value: "", label: "Todos" },
                      ...Object.entries(ETIQUETAS_ESTADO_DONACION).map(([valor, etiqueta]) => ({
                        value: valor,
                        label: etiqueta,
                      })),
                    ],
                    onChange: setFiltroDonacion,
                  },
                ]}
                filterRow={(fila) =>
                  (!filtroCalificacion ||
                    (fila.calificacion ?? "SIN_INICIO") === filtroCalificacion) &&
                  (!filtroDonacion || fila.estado === filtroDonacion)
                }
                rowClassName={(fila) =>
                  fila.discrepancia || fila.anticuerpo === "POSITIVO"
                    ? "dash-row-attention"
                    : undefined
                }
                emptyTitle="No hay donaciones pendientes con estos filtros"
                emptyDescription="Las donaciones activas y con resultados por revisar se listan aquí."
                caption="Donaciones activas o con estado de unidad pendiente."
              />
            </div>
          </Panel>

          <Panel
            id="dashboard-solicitudes"
            titulo="Pacientes y solicitudes de transfusión"
            descripcion="La distribución por estado es acumulada; la evolución y las solicitudes recientes respetan el período. Pacientes es el total registrado."
          >
            <MetricStrip
              items={[
                {
                  etiqueta: "Pacientes registrados",
                  valor: datos.solicitudes.totales.pacientesRegistrados,
                },
                { etiqueta: "Solicitudes del período", valor: datos.solicitudes.totales.periodo },
                {
                  etiqueta: "Pendientes",
                  valor: datos.solicitudes.totales.pendientes,
                },
                { etiqueta: "Aprobadas", valor: datos.solicitudes.totales.aprobadas },
                { etiqueta: "Canceladas", valor: datos.solicitudes.totales.canceladas },
                {
                  etiqueta: "Con unidades reservadas",
                  valor: datos.solicitudes.totales.conUnidadesReservadas,
                },
              ]}
            />
            <div className="dash-charts-grid">
              <article className="dash-chart-card">
                <h3>Solicitudes por estado</h3>
                <BarrasHorizontales
                  titulo="Solicitudes por estado"
                  datos={datos.solicitudes.porEstado}
                  formatearEtiqueta={(valor) => ETIQUETAS_ESTADO_SOLICITUD[valor] ?? valor}
                  onSelect={(valor) => {
                    actualizarFiltros({ estado: `solicitudes:${valor}` });
                    scrollA("dashboard-solicitudes-recientes");
                  }}
                />
                <p className="dash-chart-hint">Distribución acumulada; las filas del período se listan abajo.</p>
              </article>
              <article className="dash-chart-card">
                <h3>Evolución de solicitudes</h3>
                <GraficoLineas
                  titulo="Solicitudes por día en el período"
                  datos={datos.solicitudes.evolucion}
                  series={SERIE_ACTIVIDAD}
                  onSelect={verDia}
                />
              </article>
              <article className="dash-chart-card dash-chart-card-wide">
                <h3>Componentes más solicitados</h3>
                <BarrasHorizontales
                  titulo="Solicitudes por hemocomponente"
                  datos={datos.solicitudes.porComponente}
                  formatearEtiqueta={(valor) => ETIQUETAS_COMPONENTE[valor] ?? valor}
                  onSelect={(valor) => {
                    actualizarFiltros({ componente: valor });
                    scrollA("dashboard-solicitudes-recientes");
                  }}
                />
              </article>
            </div>
            <div className="dash-table-block" id="dashboard-solicitudes-recientes">
              <h3>Solicitudes recientes</h3>
              <DataTable
                rows={datos.solicitudes.recientes}
                columns={columnasSolicitudes}
                rowKey={(fila) => fila.id}
                searchText={(fila) =>
                  `${fila.id} ${fila.paciente} ${fila.tipo} ${fila.estado}`
                }
                searchPlaceholder="Buscar solicitud, paciente o componente…"
                emptyTitle="No hay solicitudes en el período seleccionado"
                emptyDescription="Las solicitudes registradas se listan aquí con su estado real."
                caption="Solicitudes registradas en el período seleccionado."
              />
            </div>
          </Panel>

          <Panel
            id="dashboard-transfusiones"
            titulo="Proceso transfusional"
            descripcion="Seguimiento de unidades reservadas, emitidas y bajas registradas como transfundidas. Una emisión no se presenta como transfusión finalizada."
          >
            <MetricStrip
              items={[
                {
                  etiqueta: "Aprobadas sin estudios",
                  valor: datos.transfusiones.totales.aprobadasSinEstudios,
                },
                {
                  etiqueta: "Unidades reservadas",
                  valor: datos.transfusiones.totales.unidadesReservadas,
                },
                {
                  etiqueta: "Unidades emitidas",
                  valor: datos.transfusiones.totales.unidadesEmitidas,
                },
                {
                  etiqueta: "Bajas por transfusión",
                  valor: datos.transfusiones.totales.bajasPorTransfusion,
                },
              ]}
            />
            <div className="dash-charts-grid">
              <article className="dash-chart-card">
                <h3>Estados del proceso</h3>
                <BarrasHorizontales
                  titulo="Distribución de unidades en el proceso transfusional"
                  datos={datos.transfusiones.porEstado}
                  color="#1f5f9e"
                  formatearEtiqueta={(valor) =>
                    ETIQUETAS_ESTADO_UNIDAD[valor] ?? (valor === "BAJA_TRANSFUNDIDA" ? "Baja por transfusión" : valor)
                  }
                  onSelect={(valor) => {
                    if (valor !== "BAJA_TRANSFUNDIDA") {
                      actualizarFiltros({ estado: `unidades:${valor}` });
                      scrollA("dashboard-inventario");
                    }
                  }}
                />
              </article>
              <article className="dash-chart-card dash-chart-card-wide">
                <h3>Actividad reciente de emisiones</h3>
                <DataTable
                  rows={datos.transfusiones.actividad}
                  columns={columnasTransfusiones}
                  rowKey={(fila) => `${fila.numeroUnidad}-${fila.solicitudId}-${fila.fecha}`}
                  searchText={(fila) =>
                    `${fila.paciente} ${fila.numeroUnidad} ${fila.solicitudId}`
                  }
                  searchPlaceholder="Buscar paciente, solicitud o unidad…"
                  emptyTitle="No hay emisiones registradas en el período"
                  emptyDescription="Las emisiones realizadas se vincularán aquí con paciente, solicitud y unidad."
                  caption="Emisiones registradas con su solicitud y unidad vinculadas."
                />
              </article>
            </div>
          </Panel>

          <Panel
            id="dashboard-alertas"
            titulo="Alertas y situaciones que requieren atención"
            descripcion="Situaciones detectadas a partir de los estados registrados en el sistema. No se interpretan resultados clínicos automáticamente."
            variant="alertas"
          >
            <div className="dash-alert-toolbar">
              <label>
                <span>Prioridad</span>
                <select
                  value={filtroPrioridad}
                  onChange={(evento) => setFiltroPrioridad(evento.target.value)}
                >
                  <option value="">Todas las prioridades</option>
                  <option value="Crítica">Crítica</option>
                  <option value="Alta">Alta</option>
                  <option value="Advertencia">Advertencia</option>
                  <option value="Informativa">Informativa</option>
                </select>
              </label>
              <span className="dash-alert-count">
                {alertasVisibles.length} {alertasVisibles.length === 1 ? "alerta" : "alertas"}
              </span>
            </div>
            {alertasVisibles.length === 0 ? (
              <EmptyState
                title="No hay alertas para mostrar"
                description="No se detectaron situaciones que requieran atención con los filtros actuales."
              />
            ) : (
              <ul className="dash-alert-list">
                {alertasVisibles.map((alerta: Alerta, indice) => (
                  <li key={`${alerta.tipo}-${indice}`} className="dash-alert-item">
                    <div className="dash-alert-main">
                      <span
                        className={`dash-priority dash-priority-${alerta.prioridad.toLowerCase()}`}
                      >
                        {alerta.prioridad}
                      </span>
                      <div>
                        <strong>{alerta.tipo}</strong>
                        <p>{alerta.descripcion}</p>
                        <small>
                          Registro: {alerta.registroId ?? "estado actual"} · Fecha:{" "}
                          {alerta.fecha ? formatearFecha(alerta.fecha, true) : "—"}
                        </small>
                      </div>
                    </div>
                    {esVista(alerta.vista) ? (
                      <button
                        type="button"
                        className="ui-btn ui-btn-small ui-btn-secondary"
                        onClick={() => ir(alerta.vista)}
                      >
                        Ir al módulo →
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            id="dashboard-actividad"
            titulo="Actividad reciente y trazabilidad"
            descripcion="Últimas operaciones registradas en el período, ordenadas de más reciente a más antigua."
          >
            {datos.actividad.length === 0 ? (
              <EmptyState
                title="Sin actividad en el período"
                description="Cuando se registren operaciones aparecerán aquí con fecha y responsable."
              />
            ) : (
              <ol className="dash-timeline">
                {datos.actividad.map((evento: EventoActividad, indice) => (
                  <li key={`${evento.tipo}-${evento.registroId}-${indice}`}>
                    <span className="dash-timeline-marker" aria-hidden="true" />
                    <div>
                      <strong>{evento.tipo}</strong>
                      <p>{evento.descripcion}</p>
                      <small>
                        {formatearFecha(evento.fecha, true)} · Responsable:{" "}
                        {evento.usuario || "no registrado"} · Registro #{evento.registroId}
                      </small>
                    </div>
                    {esVista(evento.vista) ? (
                      <button
                        type="button"
                        className="ui-btn ui-btn-small ui-btn-secondary"
                        onClick={() => ir(evento.vista)}
                      >
                        Consultar
                      </button>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
            <p className="dash-source-note">
              Datos generados por el servidor: {formatearHora(datos.generadoEn)} ·
              Período consultado: {formatearFecha(datos.periodo.desde)} –{" "}
              {formatearFecha(datos.periodo.hasta)}
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}
