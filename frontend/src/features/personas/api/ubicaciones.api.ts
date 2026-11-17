import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { ItemCatalogo } from "@/features/catalogos/types";

export const ubicacionesApi = {
  provincias() {
    return api.getEnvelope<ItemCatalogo[]>(endpoints.ubicaciones.provincias, { limit: 200 });
  },
  ciudades(idProvincia?: number) {
    return api.getEnvelope<ItemCatalogo[]>(endpoints.ubicaciones.ciudades, {
      limit: 200,
      idProvincia,
    });
  },
  crearProvincia(nombre: string) {
    return api.post<ItemCatalogo>(endpoints.ubicaciones.provincias, { nombre });
  },
  crearCiudad(input: { nombre: string; codigoPostal?: string; idProvincia: number }) {
    return api.post<ItemCatalogo>(endpoints.ubicaciones.ciudades, input);
  },
  crearDomicilio(input: {
    calle?: string;
    numero?: string;
    piso?: string;
    departamento?: string;
    idCiudad: number;
  }) {
    return api.post<{ id: number }>(endpoints.ubicaciones.domicilios, input);
  },
};
