import type { PaginationMeta } from "@/shared/types/api";
import type { Persona } from "@/features/personas/types";

export interface Transfusion {
  id: number;
  fecha: string | null;
  numeroOLote?: string | null;
  rt?: string | null;
  tolerancia?: string | null;
  pci?: string | null;
  pcd?: string | null;
  anticuerpo?: string | null;
  tecnico?: string | null;
  idPersona: number | null;
  persona?: Persona | null;
  grupoFactor?: { id?: number; grupo?: string | null; factor?: string | null } | null;
  fenotipo1?: { id: number; nombre?: string | null } | null;
  fenotipo2?: { id: number; nombre?: string | null } | null;
  tipoTransfusion?: { id: number; nombre?: string | null } | null;
  estadoCompatibilidad?: "COMPATIBLE" | "INCOMPATIBLE" | "SIN_DATOS" | string;
}

export interface TransfusionInput {
  fecha?: string | null;
  numeroOLote?: string | null;
  rt?: string | null;
  tolerancia?: string | null;
  pci?: string | null;
  pcd?: string | null;
  anticuerpo?: string | null;
  tecnico?: string | null;
  idPersona: number;
  idGrupoFactor?: number | null;
  idFenotipo1?: number | null;
  idFenotipo2?: number | null;
  idTipoTransfusion?: number | null;
}

export interface ListaTransfusiones {
  data: Transfusion[];
  meta: PaginationMeta;
}
