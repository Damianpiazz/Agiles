import { prisma } from "../../config/prisma";
import { unauthorized } from "../../lib/errors";
import { createToken, verifyPassword } from "../../lib/security";
import { env } from "../../config/env";
import { toPublicUsuario } from "../usuarios/usuarios.utils";
import type { LoginInput } from "./auth.schema";

export async function login(input: LoginInput) {
  const usuario = await prisma.usuario.findUnique({ where: { usuario: input.usuario } });
  if (!usuario || usuario.estado !== "ACTIVO" || !verifyPassword(input.password, usuario.passwordHash)) {
    throw unauthorized("Usuario o contraseña incorrectos");
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso: new Date() },
  });

  const token = createToken({ sub: usuario.id, usuario: usuario.usuario, rol: usuario.rol });

  return {
    token,
    expiraEnHoras: env.authTokenTtlHours,
    usuario: toPublicUsuario(actualizado),
  };
}

export async function obtenerPerfil(id: number) {
  if (id === 0) {
    return {
      id: 0,
      nombre: "Sistema",
      apellido: "Desarrollo",
      usuario: "sistema",
      rol: "ADMINISTRADOR" as const,
      estado: "ACTIVO" as const,
      ultimoAcceso: null,
    };
  }
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw unauthorized("La sesión ya no es válida");
  return toPublicUsuario(usuario);
}
