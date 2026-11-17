import type { PaginationMeta } from "@/shared/types/api";
import type { Persona } from "@/features/personas/types";

export interface Sangria {
  id: number;
  fecha: string | null;
  diagnostico?: string | null;
  extraccion?: string | null;
  reposicion?: string | null;
  tecnico?: string | null;
  idPersona: number | null;
  persona?: Persona | null;
  medico?: { id: number; nombre?: string | null } | null;
  obraSocial?: { id: number; nombre?: string | null } | null;
  edadPaciente?: number | null;
}

export interface SangriaInput {
  fecha?: string | null;
  diagnostico?: string | null;
  extraccion?: string | null;
  reposicion?: string | null;
  tecnico?: string | null;
  idPersona: number;
  idMedico?: number | null;
  idObraSocial?: number | null;
}

export interface ListaSangrias {
  data: Sangria[];
  meta: PaginationMeta;
}
