import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { ListaSangrias, Sangria, SangriaInput } from "../types";

export const sangriasApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<Sangria[]>(endpoints.sangrias.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaSangrias["meta"],
    }));
  },
  porPersona(idPersona: number) {
    return api.getEnvelope<Sangria[]>(endpoints.sangrias.porPersona(idPersona));
  },
  detalle(id: number) {
    return api.get<Sangria>(endpoints.sangrias.detalle(id));
  },
  crear(input: SangriaInput) {
    return api.post<Sangria>(endpoints.sangrias.base, input);
  },
  actualizar(id: number, input: Partial<SangriaInput>) {
    return api.put<Sangria>(endpoints.sangrias.detalle(id), input);
  },
};
