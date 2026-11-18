import type { PaginationMeta } from "@/shared/types/api";
import type { Persona } from "@/features/personas/types";

export interface DetalleCatalogo {
  id: number;
  nombre?: string | null;
}

export interface ResultadoSerologia {
  id?: number;
  determinacionSerologicaId: number;
  resultado: string;
  valor?: string | null;
  unidad?: string | null;
  observacion?: string | null;
  determinacionSerologica?: DetalleCatalogo | null;
}

export interface Serologia {
  id: number;
  fecha: string | null;
  hora: string | null;
  tipoMuestra?: "PRIMERA" | "SEGUNDA" | string | null;
  operador?: string | null;
  observaciones?: string | null;
  resultados: ResultadoSerologia[];
}

export interface ResultadoPci {
  id?: number;
  antigenoId: number;
  resultado: string;
  intensidad?: string | null;
  observacion?: string | null;
  antigeno?: DetalleCatalogo | null;
}

export interface Pci {
  id: number;
  fecha: string | null;
  hora: string | null;
  operador?: string | null;
  observaciones?: string | null;
  resultados: ResultadoPci[];
}

export interface Donacion {
  id: number;
  fecha: string | null;
  idPersona: number | null;
  persona?: Persona | null;
  grupoFactor?: { id?: number; grupo?: string | null; factor?: string | null } | null;
  peso?: number | string | null;
  tensionArterial?: string | null;
  hemoglobina?: number | string | null;
  voluntario?: boolean | null;
  reposicion?: boolean | null;
  autoexcluido?: boolean | null;
  dniReceptorReposicion?: string | null;
  operador?: string | null;
  observaciones?: string | null;
  estadoEstudios?: { codigo: string; etiqueta: string };
  fechasDonaciones?: string[];
  serologiaDonaciones?: Array<{ id: number; serologia: Serologia }>;
  pciDonaciones?: Array<{ id: number; pci: Pci }>;
}

export interface EstudiosDonacion {
  donacion: {
    id: number;
    fecha: string | null;
    operador?: string | null;
    voluntario?: boolean | null;
    reposicion?: boolean | null;
    dniReceptorReposicion?: string | null;
    observaciones?: string | null;
  };
  persona: Persona | null;
  grupoFactor?: { id?: number; grupo?: string | null; factor?: string | null } | null;
  pci: Pci | null;
  pciEstudios: Pci[];
  serologiaPrimera: Serologia | null;
  serologiaSegunda: Serologia | null;
  serologias: Serologia[];
  estado: { codigo: string; etiqueta: string };
}

export interface EstudiosInput {
  serologias?: Array<{
    tipoMuestra: "PRIMERA" | "SEGUNDA";
    fecha: string;
    hora: string;
    operador?: string;
    observaciones?: string;
    resultados: Array<{
      determinacionSerologicaId: number;
      resultado: string;
      valor?: string;
      unidad?: string;
      observacion?: string;
    }>;
  }>;
  pci?: {
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
  };
}

export type DonacionCompletaInput = {
  idPersona: number;
  idGrupoFactor?: number | null;
  donacion: {
    peso?: number | null;
    tensionArterial?: string;
    hemoglobina?: number | null;
    fecha?: string;
    voluntario?: boolean;
    reposicion?: boolean;
    dniReceptorReposicion?: string;
    observaciones?: string;
    operador?: string;
  };
  serologias?: EstudiosInput["serologias"];
  pci?: EstudiosInput["pci"];
};

export interface ListaDonaciones {
  data: Donacion[];
  meta: PaginationMeta;
}
