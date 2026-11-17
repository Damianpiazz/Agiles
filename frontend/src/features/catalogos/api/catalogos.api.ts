import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { PaginationMeta, QueryParams } from "@/shared/types/api";
import type { CatalogoConsolidado, ItemCatalogo } from "../types";

export const catalogosApi = {
  consolidado() {
    return api.get<CatalogoConsolidado>(endpoints.catalogos.base);
  },
  listar(recurso: keyof typeof endpoints.catalogos, params?: QueryParams) {
    return api.getEnvelope<ItemCatalogo[]>(endpoints.catalogos[recurso], params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as PaginationMeta,
    }));
  },
  crear(recurso: keyof typeof endpoints.catalogos, body: Record<string, unknown>) {
    return api.post<ItemCatalogo>(endpoints.catalogos[recurso], body);
  },
  actualizar(recurso: keyof typeof endpoints.catalogos, id: number, body: Record<string, unknown>) {
    return api.put<ItemCatalogo>(`${endpoints.catalogos[recurso]}/${id}`, body);
  },
  eliminar(recurso: keyof typeof endpoints.catalogos, id: number) {
    return api.delete(`${endpoints.catalogos[recurso]}/${id}`);
  },
};

export const recursosCatalogo = [
  { clave: "gruposFactor", titulo: "Grupo y factor (G y F)", endpoint: "gruposFactor" as const },
  { clave: "obrasSociales", titulo: "Obras sociales", endpoint: "obrasSociales" as const },
  { clave: "medicos", titulo: "Médicos", endpoint: "medicos" as const },
  { clave: "determinacionesSerologicas", titulo: "Determinaciones serológicas", endpoint: "determinacionesSerologicas" as const },
  { clave: "determinacionesPcd", titulo: "Determinaciones de PCD", endpoint: "determinacionesPcd" as const },
  { clave: "antigenos", titulo: "Antígenos", endpoint: "antigenos" as const },
  { clave: "fenotipos", titulo: "Fenotipos", endpoint: "fenotipos" as const },
  { clave: "tiposTransfusion", titulo: "Tipos de transfusión", endpoint: "tiposTransfusion" as const },
] as const;
