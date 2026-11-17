import { api, apiDownload } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { NumeroHemo, ReporteHemo, ResumenHemo } from "../types";

const NOMBRES: Record<NumeroHemo, string> = {
  1: "hemo-1-donantes",
  2: "hemo-2-hemocomponentes",
  3: "hemo-3-transfusiones",
  4: "hemo-4-reacciones",
  5: "hemo-5-gestantes-rn",
};

export const reportesApi = {
  resumen(params?: QueryParams) {
    return api.get<ResumenHemo>(endpoints.reportes.resumen, params);
  },
  hemo(numero: NumeroHemo, params?: QueryParams) {
    return api.get<ReporteHemo>(endpoints.reportes.hemo(numero), params);
  },
  descargar(numero: NumeroHemo, params?: QueryParams) {
    return apiDownload(`${NOMBRES[numero]}.csv`, endpoints.reportes.hemo(numero), {
      ...params,
      formato: "csv",
    });
  },
  descargarResumen(params?: QueryParams) {
    return apiDownload("hemo-resumen.csv", endpoints.reportes.resumen, { ...params, formato: "csv" });
  },
};
