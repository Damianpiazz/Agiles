import type { PaginationMeta } from "@/shared/types/api";

export interface EventoAuditoria {
  id: number;
  fechaHora: string | null;
  usuario: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: string | null;
  ruta?: string | null;
}

export interface OpcionesAuditoria {
  acciones: string[];
  entidades: string[];
  usuarios: string[];
}

export interface ListaAuditoria {
  data: EventoAuditoria[];
  meta: PaginationMeta;
}
