import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { ListaRecienNacidos, RecienNacido, RecienNacidoCompletoInput } from "../types";

export const recienNacidosApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<RecienNacido[]>(endpoints.recienNacidos.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaRecienNacidos["meta"],
    }));
  },
  detalle(id: number) {
    return api.get<RecienNacido>(endpoints.recienNacidos.detalle(id));
  },
  guardarCompleta(input: RecienNacidoCompletoInput) {
    return api.post<RecienNacido>(endpoints.recienNacidos.completa, input);
  },
};
