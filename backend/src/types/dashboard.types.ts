import { z } from "zod";

export const dashboardFiltrosSchema = z
  .object({
    desde: z.string().datetime({ offset: true }),
    hasta: z.string().datetime({ offset: true }),
    componente: z.string().max(40).default(""),
    grupo: z.string().max(3).default(""),
    estado: z.string().max(40).default(""),
  })
  .refine((value) => new Date(value.desde).getTime() < new Date(value.hasta).getTime(), {
    message: "El período es inválido",
  })
  .refine(
    (value) =>
      new Date(value.hasta).getTime() - new Date(value.desde).getTime() <=
      1000 * 60 * 60 * 24 * 366,
    { message: "El período no puede superar un año" },
  );

export type DashboardFiltros = z.output<typeof dashboardFiltrosSchema>;

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
