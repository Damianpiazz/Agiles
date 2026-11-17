import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { ListaTransfusiones, Transfusion, TransfusionInput } from "../types";

export const transfusionesApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<Transfusion[]>(endpoints.transfusiones.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaTransfusiones["meta"],
    }));
  },
  porPersona(idPersona: number) {
    return api.getEnvelope<Transfusion[]>(endpoints.transfusiones.porPersona(idPersona));
  },
  detalle(id: number) {
    return api.get<Transfusion>(endpoints.transfusiones.detalle(id));
  },
  crear(input: TransfusionInput) {
    return api.post<Transfusion>(endpoints.transfusiones.base, input);
  },
  actualizar(id: number, input: Partial<TransfusionInput>) {
    return api.put<Transfusion>(endpoints.transfusiones.detalle(id), input);
  },
};
