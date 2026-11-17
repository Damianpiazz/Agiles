import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { EventoAuditoria, ListaAuditoria, OpcionesAuditoria } from "../types";

export const auditoriaApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<EventoAuditoria[]>(endpoints.auditoria.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaAuditoria["meta"],
    }));
  },
  opciones() {
    return api.get<OpcionesAuditoria>(endpoints.auditoria.opciones);
  },
};
