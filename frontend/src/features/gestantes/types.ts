import type { PaginationMeta } from "@/shared/types/api";
import type { Persona } from "@/features/personas/types";
import type { Pci, ResultadoPci, Serologia } from "@/features/donaciones/types";

export interface EstudioPciInput {
  fecha: string;
  hora: string;
  operador?: string;
  observaciones?: string;
  resultados: Array<{
    antigenoId: number;
    resultado: string;
    intensidad?: string;
    observacion?: string;
  }>;
}

export interface GestanteCompletaInput {
  idPersona: number;
  estudio: {
    numero?: string;
    fecha?: string | null;
    operador?: string;
  };
  pci?: EstudioPciInput;
  compatibilidadConyugal?: EstudioPciInput;
}

export interface EstudioGestante {
  id: number;
  numero?: string | null;
  fecha: string | null;
  operador?: string | null;
  idPersona: number;
  gestante?: Persona | null;
  pciAsociados?: Array<{ id?: number; pci: Pci }>;
}

export interface ListaGestantes {
  data: EstudioGestante[];
  meta: PaginationMeta;
}

export interface ResultadoPcd {
  id?: number;
  idDeterminacionPcd?: number | null;
  resultado?: string | null;
  valor?: string | null;
  unidad?: string | null;
  observacion?: string | null;
}

export interface Pcd {
  id: number;
  fecha: string | null;
  hora: string | null;
  resultados: ResultadoPcd[];
}

export interface RecienNacido {
  id: number;
  numero?: string | null;
  fecha: string | null;
  rn?: string | null;
  dni?: string | null;
  ipAntiD?: string | null;
  observaciones?: string | null;
  idMadre?: number | null;
  madre?: Persona | null;
  grupoFactor?: { id?: number; grupo?: string | null; factor?: string | null } | null;
  pci?: Pci | null;
  pcd?: Pcd | null;
}

export interface RecienNacidoInput {
  numero?: string;
  fecha?: string | null;
  rn?: string;
  dni?: string;
  idMadre?: number | null;
  idGrupoFactor?: number | null;
  ipAntiD?: string;
  operador?: string;
  observaciones?: string;
}

export interface PcdInput {
  fecha: string;
  hora: string;
  operador?: string;
  observaciones?: string;
  resultados: ResultadoPcd[];
}

export interface RecienNacidoCompletoInput {
  estudio: RecienNacidoInput;
  pci?: EstudioPciInput;
  pcd?: PcdInput;
}

export interface ListaRecienNacidos {
  data: RecienNacido[];
  meta: PaginationMeta;
}

export type ResultadoPciCatalogo = ResultadoPci;
export type SerologiaCatalogo = Serologia;
