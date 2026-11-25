export type PeriodoPreset =
  | "hoy"
  | "7d"
  | "30d"
  | "90d"
  | "mesActual"
  | "mesAnterior"
  | "personalizado";

export type FiltrosDashboard = {
  periodo: PeriodoPreset;
  desde: string;
  hasta: string;
  componente: string;
  grupo: string;
  estado: string;
};

export const PERIODOS: { value: PeriodoPreset; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "90d", label: "Últimos 90 días" },
  { value: "mesActual", label: "Este mes" },
  { value: "mesAnterior", label: "Mes anterior" },
  { value: "personalizado", label: "Rango personalizado" },
];

export const COMPONENTES: { value: string; label: string }[] = [
  { value: "", label: "Todos los hemocomponentes" },
  { value: "GLOBULOS_ROJOS", label: "Glóbulos rojos" },
  { value: "PLASMA", label: "Plasma" },
  { value: "PLAQUETAS", label: "Plaquetas" },
  { value: "CRIOPRECIPITADO", label: "Crioprecipitados" },
];

export const GRUPOS: { value: string; label: string }[] = [
  { value: "", label: "Todos los grupos" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

/** El prefijo indica el módulo al que se aplica el estado. */
export const ESTADOS: { value: string; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "unidades:DISPONIBLE", label: "Inventario · Disponible" },
  { value: "unidades:RESERVADA", label: "Inventario · Reservada" },
  { value: "unidades:BLOQUEADA", label: "Inventario · Bloqueada" },
  { value: "unidades:EMITIDA", label: "Inventario · Emitida" },
  { value: "unidades:VENCIDA", label: "Inventario · Vencida" },
  { value: "unidades:DADA_DE_BAJA", label: "Inventario · Dada de baja" },
  { value: "donaciones:REGISTRADA", label: "Donaciones · Registrada" },
  { value: "donaciones:EN_CALIFICACION", label: "Donaciones · En calificación" },
  { value: "donaciones:CALIFICADA", label: "Donaciones · Calificada" },
  { value: "donaciones:RECHAZADA", label: "Donaciones · Rechazada" },
  { value: "solicitudes:PENDIENTE", label: "Solicitudes · Pendiente" },
  { value: "solicitudes:APROBADA", label: "Solicitudes · Aprobada" },
  { value: "solicitudes:CANCELADA", label: "Solicitudes · Cancelada" },
];

export type Conteo = { label: string; value: number };
export type ConteoComponente = {
  tipo: string;
  disponible: number;
  reservada: number;
  bloqueada: number;
};
export type SerieDiaria = {
  fecha: string;
  entradas?: number;
  salidas?: number;
  emitidas?: number;
  cantidad?: number;
};
export type UnidadVencimiento = {
  id: number;
  numeroUnidad: string;
  tipo: string;
  grupo: string;
  fechaVencimiento: string;
  estado: string;
  diasRestantes: number;
};
export type DonacionPendiente = {
  id: number;
  donante: string;
  dni: string;
  fecha: string;
  estado: string;
  calificacion: string | null;
  estadoUnidad: string;
  anticuerpo: string | null;
  discrepancia: boolean;
};
export type SolicitudReciente = {
  id: number;
  paciente: string;
  fecha: string;
  tipo: string;
  cantidad: number;
  estado: string;
};
export type ActividadTransfusion = {
  paciente: string;
  solicitudId: number;
  numeroUnidad: string;
  tipo: string;
  estadoUnidad: string;
  fecha: string;
  responsable: string;
};
export type Alerta = {
  tipo: string;
  descripcion: string;
  registroId: number | null;
  fecha: string | null;
  prioridad: "Crítica" | "Alta" | "Advertencia" | "Informativa";
  vista: string;
};
export type EventoActividad = {
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario: string;
  registroId: number;
  vista: string;
};

export type DashboardSnapshot = {
  generadoEn: string;
  periodo: { desde: string; hasta: string };
  kpis: {
    unidadesDisponibles: number;
    calificacionesPendientes: number;
    solicitudesPendientes: number;
    unidadesProximasVencer: number;
    donacionesPeriodo: number;
    unidadesEmitidas: number;
  };
  comparativos: { donacionesAnterior: number; solicitudesAnterior: number };
  inventario: {
    totales: {
      disponible: number;
      reservada: number;
      bloqueada: number;
      emitida: number;
      vencida: number;
      dadaDeBaja: number;
      proximasVencer: number;
    };
    porComponente: ConteoComponente[];
    porGrupo: Conteo[];
    porEstado: Conteo[];
    evolucion: SerieDiaria[];
    vencimientos: UnidadVencimiento[];
  };
  donaciones: {
    totales: {
      periodo: number;
      registradas: number;
      enCalificacion: number;
      calificadas: number;
      rechazadas: number;
      calificacionesIniciadas: number;
      sinCalificacion: number;
      pendientesLiberacion: number;
      unidadesBloqueadas: number;
    };
    evolucion: SerieDiaria[];
    estadosCalificacion: Conteo[];
    flujo: Conteo[];
    pendientes: DonacionPendiente[];
  };
  solicitudes: {
    totales: {
      pacientesRegistrados: number;
      periodo: number;
      pendientes: number;
      aprobadas: number;
      canceladas: number;
      conUnidadesReservadas: number;
    };
    porEstado: Conteo[];
    evolucion: SerieDiaria[];
    porComponente: Conteo[];
    recientes: SolicitudReciente[];
  };
  transfusiones: {
    totales: {
      aprobadasSinEstudios: number;
      unidadesReservadas: number;
      unidadesEmitidas: number;
      bajasPorTransfusion: number;
    };
    porEstado: Conteo[];
    actividad: ActividadTransfusion[];
  };
  alertas: Alerta[];
  actividad: EventoActividad[];
};

export function esSnapshot(value: unknown): value is DashboardSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const objeto = value as Partial<DashboardSnapshot>;
  return (
    typeof objeto.kpis === "object" &&
    objeto.kpis !== null &&
    typeof objeto.inventario === "object" &&
    Array.isArray(objeto.alertas) &&
    Array.isArray(objeto.actividad)
  );
}
