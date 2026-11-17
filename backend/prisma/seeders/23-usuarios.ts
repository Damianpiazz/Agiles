import type { PrismaClient } from "../../generated/prisma/client";
import { hashPassword } from "../../src/lib/security";
import {
  CANTIDAD,
  ROLES_USUARIO,
  apellido,
  booleano,
  fechaReciente,
  nombre,
  pick,
  resetFake,
  slug,
} from "./_fake";

type UsuarioSeed = {
  usuario: string;
  nombre: string;
  apellido: string;
  password: string;
  rol: (typeof ROLES_USUARIO)[number];
  estado: "ACTIVO" | "INACTIVO";
  ultimoAcceso?: Date | null;
};

/**
 * Usuarios de demostración para las pantallas 01 (login) y 09 (usuarios).
 * Las contraseñas son solo para desarrollo; cambialas fuera de ese entorno.
 */
export async function seed23Usuarios(prisma: PrismaClient) {
  resetFake(123);

  // Los tres primeros usuarios se conservan: son las credenciales documentadas.
  const data: UsuarioSeed[] = [
    {
      usuario: "admin",
      nombre: "Facundo",
      apellido: "Pérez",
      password: "Admin.123",
      rol: "ADMINISTRADOR",
      estado: "ACTIVO",
    },
    {
      usuario: "fperez",
      nombre: "Paula",
      apellido: "Suárez",
      password: "Tecnico.123",
      rol: "TECNICO_HEMOTERAPIA",
      estado: "ACTIVO",
    },
    {
      usuario: "maternidad",
      nombre: "Usuario",
      apellido: "Maternidad",
      password: "Consulta.123",
      rol: "CONSULTA_MATERNIDAD",
      estado: "ACTIVO",
    },
  ];

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    const nombreGenerado = nombre();
    const apellidoGenerado = apellido();
    data.push({
      usuario: `${slug(nombreGenerado)}.${slug(apellidoGenerado)}${id}`,
      nombre: nombreGenerado,
      apellido: apellidoGenerado,
      password: "Demo.123",
      rol: pick(ROLES_USUARIO),
      estado: booleano(0.85) ? "ACTIVO" : "INACTIVO",
      ultimoAcceso: booleano(0.7) ? fechaReciente() : null,
    });
  }

  // Cacheamos el hash por contraseña para no hashear 60 veces la misma clave demo.
  const hashes = new Map<string, string>();
  for (const usuario of data) {
    const { password, ...rest } = usuario;
    let passwordHash = hashes.get(password);
    if (!passwordHash) {
      passwordHash = hashPassword(password);
      hashes.set(password, passwordHash);
    }
    await prisma.usuario.upsert({
      where: { usuario: usuario.usuario },
      update: { ...rest, passwordHash },
      create: { ...rest, passwordHash },
    });
  }

  console.log(`23-usuarios: ${data.length} registros`);
}
