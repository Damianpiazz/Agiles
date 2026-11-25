/** Tipos de las consultas globales conectadas a datos reales del backend. */

export type PacienteListado = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  operador: string;
  createdAt: string;
  updatedAt?: string;
  _count?: { solicitudesTransfusion: number };
};

export type UnidadInventario = {
  id: number;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABO: string;
  factorRhD: string;
  fechaVencimiento: string;
  estado: string;
  operador: string;
  fechaRecepcion: string;
  solicitudId: number | null;
  reservadaPor: string | null;
  reservadaEn: string | null;
  motivoBaja: string | null;
  operadorBaja: string | null;
  fechaBaja: string | null;
};

export type EstudioGlobal = {
  id: number;
  solicitudId: number;
  tipo: string;
  resultado: string;
  compatibilidad: string | null;
  observaciones: string | null;
  operador: string;
  fechaHora: string;
  alerta?: string | null;
  solicitud?: {
    id: number;
    dniPaciente: string;
    nombrePaciente: string;
    estado: string;
    fechaHora: string;
  } | null;
  unidadSangre?: { id: number; numeroUnidad: string } | null;
};

export type EtiquetaGlobal = {
  receptor: {
    nombre: string;
    dni: string;
    grupoABO: string;
    factorRhD: string;
  };
  unidad: {
    numeroUnidad: string;
    tipoHemocomponente: string;
    grupoABO: string;
    factorRhD: string;
    fechaVencimiento: string;
  };
  requisitosEspeciales: string | null;
  interpretacionCompatibilidad: string;
  compatibilidadCompleta: boolean;
  caracter: string | null;
  fechaHoraSalida: string;
  responsable: string;
};

export type EmisionGlobal = {
  id: number;
  solicitudId: number;
  unidadSangreId: number;
  dniPaciente: string;
  nombrePaciente: string;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABOUnidad: string;
  factorRhDUnidad: string;
  resultadoCompatibilidad: string | null;
  compatibilidadCompleta: boolean;
  caracter: string | null;
  responsable: string;
  observaciones: string | null;
  fechaHora: string;
  etiqueta: EtiquetaGlobal;
  solicitud?: { id: number; estado: string; fechaHora: string } | null;
  unidadSangre?: { id: number; estado: string } | null;
};

export type HistoriaDonante = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  activo: boolean;
  fechaNacimiento: string;
  createdAt: string;
};

export type HistoriaPaciente = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  operador: string;
  createdAt: string;
};

export type HistoriaDonacion = {
  id: number;
  fechaHora: string;
  estado: string;
  estadoUnidad: string;
  operador: string;
  observaciones: string | null;
  calificacionBiologica: { estado: string } | null;
  tipificacionesSanguineas: { grupoABO: string; factorRhD: string }[];
  anticuerpoIrregular: { resultado: string } | null;
  eventosEstadoUnidad: {
    estado: string;
    motivo: string | null;
    usuario: string;
    fechaHora: string;
  }[];
};

export type HistoriaSolicitud = {
  id: number;
  dniPaciente: string;
  nombrePaciente: string;
  estado: string;
  tipoHemocomponente: string;
  cantidad: number;
  fechaHora: string;
  fechaHoraRecepcion: string | null;
  pacienteId: number | null;
  operador: string;
  auditoria: {
    id: number;
    accion: string;
    motivo: string | null;
    operador: string;
    fechaHora: string;
  }[];
};

export type HistoriaEmision = {
  id: number;
  fechaHora: string;
  dniPaciente: string;
  nombrePaciente: string;
  responsable: string;
  numeroUnidad: string;
  unidadSangre: { numeroUnidad: string; estado: string } | null;
};

export type HistoriaEstudio = {
  id: number;
  tipo: string;
  resultado: string;
  compatibilidad: string | null;
  fechaHora: string;
  operador: string;
  solicitud: { id: number; dniPaciente: string; estado: string } | null;
  unidadSangre: { numeroUnidad: string } | null;
};

export type HistoriaPersona = {
  dni: string;
  donante: HistoriaDonante | null;
  paciente: HistoriaPaciente | null;
  donaciones: HistoriaDonacion[];
  solicitudes: HistoriaSolicitud[];
  emisiones: HistoriaEmision[];
  estudios: HistoriaEstudio[];
  resumen: {
    esDonante: boolean;
    esPaciente: boolean;
    donanteActivo: boolean | null;
    totalDonaciones: number;
    totalSolicitudes: number;
    totalEmisiones: number;
    totalEstudios: number;
  };
};
