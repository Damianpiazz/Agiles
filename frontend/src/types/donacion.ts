export type DonanteResumen = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
};

/** Respuesta de GET /api/donaciones: donación real con su donante y estudios. */
export type DonacionResumen = {
  id: number;
  fechaHora: string;
  estado: "REGISTRADA" | "EN_CALIFICACION" | "CALIFICADA" | "RECHAZADA";
  estadoUnidad: "PENDIENTE" | "LIBERADA" | "BLOQUEADA";
  operador: string;
  donante: DonanteResumen;
  calificacionBiologica: { estado: string } | null;
  tipificacionesSanguineas: { grupoABO: string; factorRhD: string }[];
  anticuerpoIrregular: { resultado: string } | null;
};
