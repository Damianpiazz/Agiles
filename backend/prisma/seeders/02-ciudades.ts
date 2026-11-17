import type { PrismaClient } from "../../generated/prisma/client";

export async function seed02Ciudades(prisma: PrismaClient) {
  const data = [
    { id: 1, nombre: "Resistencia", codigoPostal: "3500", idProvincia: 1 },
    { id: 2, nombre: "Barranqueras", codigoPostal: "3503", idProvincia: 1 },
    { id: 3, nombre: "Corrientes", codigoPostal: "3400", idProvincia: 2 },
  ];

  for (const ciudad of data) {
    await prisma.ciudad.upsert({
      where: { id: ciudad.id },
      update: { nombre: ciudad.nombre, codigoPostal: ciudad.codigoPostal, idProvincia: ciudad.idProvincia },
      create: ciudad,
    });
  }

  console.log(`02-ciudades: ${data.length} registros`);
}
