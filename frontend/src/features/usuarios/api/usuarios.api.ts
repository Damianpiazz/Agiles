import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { ListaUsuarios, Usuario, UsuarioInput } from "../types";

export const usuariosApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<Usuario[]>(endpoints.usuarios.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaUsuarios["meta"],
    }));
  },
  detalle(id: number) {
    return api.get<Usuario>(endpoints.usuarios.detalle(id));
  },
  crear(input: UsuarioInput) {
    return api.post<Usuario>(endpoints.usuarios.base, input);
  },
  actualizar(id: number, input: Partial<UsuarioInput>) {
    return api.put<Usuario>(endpoints.usuarios.detalle(id), input);
  },
};
