import type { Usuario } from "../../../generated/prisma/client";

/** Quita el hash de contraseña antes de devolver un usuario por la API. */
export function toPublicUsuario(usuario: Usuario): Omit<Usuario, "passwordHash"> {
  const { passwordHash: _passwordHash, ...publico } = usuario;
  return publico;
}
