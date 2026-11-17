export interface PeriodoReporte {
  desde: string | null;
  hasta: string | null;
}

export interface ResumenHemo extends PeriodoReporte {
  donantesAtendidos: number;
  donantesUnicos: number;
  hemocomponentesTransfundidos: number;
  unidadesDescartadas: number;
  gestantesEstudiadas: number;
  recienNacidosEstudiados: number;
  sangriasTerapeuticas: number;
  aptitud: { aptos: number; excluidos: number; enRevision: number };
}

export interface ReporteHemo extends PeriodoReporte {
  totales: Record<string, number | string>;
  detalle: Array<Record<string, unknown>>;
  [clave: string]: unknown;
}

export type NumeroHemo = 1 | 2 | 3 | 4 | 5;
