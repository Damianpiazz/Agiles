import type { PrismaClient } from "../../generated/prisma/client";

export async function seed01Provincias(prisma: PrismaClient) {
  const data = [{ id: 1, nombre: "Chaco" }, { id: 2, nombre: "Corrientes" }, { id: 3, nombre: "Santa Fe" }];

  for (const provincia of data) {
    await prisma.provincia.upsert({
      where: { id: provincia.id },
      update: { nombre: provincia.nombre },
      create: provincia,
    });
  }

  console.log(`01-provincias: ${data.length} registros`);
}
