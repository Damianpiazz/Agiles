import type { PrismaClient } from "../../generated/prisma/client";
import { hashPassword } from "../../src/lib/security";

/**
 * Usuarios de demostración para las pantallas 01 (login) y 09 (usuarios).
 * Las contraseñas son solo para desarrollo; cambialas fuera de ese entorno.
 */
export async function seed23Usuarios(prisma: PrismaClient) {
  const data = [
    {
      usuario: "admin",
      nombre: "Facundo",
      apellido: "Pérez",
      password: "Admin.123",
      rol: "ADMINISTRADOR" as const,
      estado: "ACTIVO" as const,
    },
    {
      usuario: "fperez",
      nombre: "Paula",
      apellido: "Suárez",
      password: "Tecnico.123",
      rol: "TECNICO_HEMOTERAPIA" as const,
      estado: "ACTIVO" as const,
    },
    {
      usuario: "maternidad",
      nombre: "Usuario",
      apellido: "Maternidad",
      password: "Consulta.123",
      rol: "CONSULTA_MATERNIDAD" as const,
      estado: "ACTIVO" as const,
    },
  ];

  for (const usuario of data) {
    const { password, ...rest } = usuario;
    await prisma.usuario.upsert({
      where: { usuario: usuario.usuario },
      update: { ...rest, passwordHash: hashPassword(password) },
      create: { ...rest, passwordHash: hashPassword(password) },
    });
  }

  console.log(`23-usuarios: ${data.length} registros`);
}
