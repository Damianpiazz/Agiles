import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { DonacionCompletaInput, Donacion, EstudiosDonacion, EstudiosInput, ListaDonaciones } from "../types";

export const donacionesApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<Donacion[]>(endpoints.donaciones.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaDonaciones["meta"],
    }));
  },
  detalle(id: number) {
    return api.get<Donacion>(endpoints.donaciones.detalle(id));
  },
  estudios(id: number) {
    return api.get<EstudiosDonacion>(endpoints.donaciones.estudios(id));
  },
  guardarEstudios(id: number, input: EstudiosInput) {
    return api.put<EstudiosDonacion>(endpoints.donaciones.estudios(id), input);
  },
  crearCompleta(input: DonacionCompletaInput) {
    return api.post<EstudiosDonacion>(endpoints.donaciones.completa, input);
  },
};
