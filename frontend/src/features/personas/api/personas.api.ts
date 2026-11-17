import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import type { QueryParams } from "@/shared/types/api";
import type { GrupoFactor, HistorialPersona, ListaPersonas, Persona, PersonaInput, Semaforo } from "../types";

export const personasApi = {
  listar(params?: QueryParams) {
    return api.getEnvelope<Persona[]>(endpoints.personas.base, params).then((respuesta) => ({
      data: respuesta.data,
      meta: respuesta.meta as ListaPersonas["meta"],
    }));
  },
  buscar(termino: string) {
    return api.get<Persona[]>(endpoints.personas.buscar, { q: termino });
  },
  porDni(dni: string) {
    return api.get<Persona | null>(endpoints.personas.porDni(dni));
  },
  revision() {
    return api.get<Persona[]>(endpoints.personas.revision);
  },
  historial(id: number) {
    return api.get<HistorialPersona>(endpoints.personas.historial(id));
  },
  semaforo(id: number) {
    return api.get<Semaforo>(endpoints.personas.semaforo(id));
  },
  detalle(id: number) {
    return api.get<Persona>(endpoints.personas.detalle(id));
  },
  crear(input: PersonaInput) {
    return api.post<Persona>(endpoints.personas.base, input);
  },
  actualizar(id: number, input: Partial<PersonaInput>) {
    return api.put<Persona>(endpoints.personas.detalle(id), input);
  },
  asignarGrupoFactor(id: number, input: { idGrupoFactor?: number | null; grupo?: string; factor?: string }) {
    return api.post<Persona>(endpoints.personas.grupoFactor(id), input);
  },
};

export function esGrupoFactor(valor: unknown): valor is GrupoFactor {
  return typeof valor === "object" && valor !== null && "id" in valor;
}
