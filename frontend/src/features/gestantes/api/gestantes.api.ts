import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { EstudioGestante, GestanteCompletaInput, ListaGestantes } from "../types";

export const gestantesApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<EstudioGestante[]>(endpoints.gestantes.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaGestantes["meta"],
    }));
  },
  porPersona(idPersona: number) {
    return api.getEnvelope<EstudioGestante[]>(endpoints.gestantes.porPersona(idPersona));
  },
  detalle(id: number) {
    return api.get<EstudioGestante>(endpoints.gestantes.detalle(id));
  },
  guardarCompleta(input: GestanteCompletaInput) {
    return api.post<EstudioGestante>(endpoints.gestantes.completa, input);
  },
};
