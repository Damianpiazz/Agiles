import type { PaginationMeta } from "@/shared/types/api";

export type ColorSemaforo = "VERDE" | "AMARILLO" | "ROJO" | "GRIS";

export interface Semaforo {
  estado: "APTO" | "REVISAR" | "EXCLUIDO" | "SIN_ESTUDIOS" | string;
  color: ColorSemaforo;
  colorHex: string;
  motivo: string;
}

export interface Direccion {
  id: number;
  calle?: string | null;
  numero?: string | null;
  piso?: string | null;
  departamento?: string | null;
  ciudad?: { id: number; nombre: string; provincia?: { id: number; nombre: string } | null } | null;
}

export interface GrupoFactor {
  id: number;
  grupo: string | null;
  factor: string | null;
}

export interface ResumenHistorial {
  donaciones: number;
  transfusiones: number;
  estudiosGestante: number;
  recienNacidos: number;
  sangrias: number;
}

export interface Persona {
  id: number;
  dni: string | null;
  historiaClinica: string | null;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  sexoBiologico: "MASCULINO" | "FEMENINO" | string | null;
  idDireccion: number | null;
  idGrupoFactor: number | null;
  edad?: number | null;
  grupoFactor?: GrupoFactor | null;
  direccion?: Direccion | null;
  semaforo?: Semaforo;
  resumen?: ResumenHistorial;
}

export interface PersonaInput {
  dni: string;
  nombre?: string | null;
  apellido?: string | null;
  historiaClinica?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  lugarNacimiento?: string | null;
  sexoBiologico?: "MASCULINO" | "FEMENINO" | null;
  idDireccion?: number | null;
  idGrupoFactor?: number | null;
}

export interface HistorialPersona {
  persona: Persona;
  semaforo: Semaforo;
  resumen: ResumenHistorial;
  donaciones: Array<{ id: number; fecha: string | null; observaciones?: string | null }>;
  transfusiones: Array<{ id: number; fecha: string | null; numeroOLote?: string | null }>;
  estudiosGestante: Array<{ id: number; fecha: string | null; numero?: string | null }>;
  estudiosRecienNacido: Array<{ id: number; fecha: string | null; rn?: string | null }>;
  sangriasTerapeuticas: Array<{ id: number; fecha: string | null; diagnostico?: string | null }>;
}

export interface ListaPersonas {
  data: Persona[];
  meta: PaginationMeta;
}
