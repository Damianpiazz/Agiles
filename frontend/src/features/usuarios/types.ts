import type { PaginationMeta } from "@/shared/types/api";
import type { Rol } from "@/shared/constants/roles";

export type EstadoUsuario = "ACTIVO" | "INACTIVO" | string;

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: Rol | string;
  estado: EstadoUsuario;
}

export interface UsuarioInput {
  nombre: string;
  apellido: string;
  usuario: string;
  password?: string;
  rol: Rol;
  estado: "ACTIVO" | "INACTIVO";
}

export interface ListaUsuarios {
  data: Usuario[];
  meta: PaginationMeta;
}
