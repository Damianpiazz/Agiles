import type { Rol } from "@/shared/constants/roles";

export interface UsuarioPublico {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: Rol;
  estado: "ACTIVO" | "INACTIVO" | string;
  ultimoAcceso: string | null;
}

export interface Sesion {
  token: string;
  expiraEnHoras: number;
  usuario: UsuarioPublico;
}

export interface Credenciales {
  usuario: string;
  password: string;
}
