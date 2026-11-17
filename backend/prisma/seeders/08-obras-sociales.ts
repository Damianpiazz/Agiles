import type { PrismaClient } from "../../generated/prisma/client";

export async function seed08ObrasSociales(prisma: PrismaClient) {
  const data = [
    { id: 1, nombre: "INSSSEP" },
    { id: 2, nombre: "OSDE" },
    { id: 3, nombre: "PAMI" },
  ];

  for (const item of data) {
    await prisma.obraSocial.upsert({ where: { id: item.id }, update: { nombre: item.nombre }, create: item });
  }
  console.log(`08-obras-sociales: ${data.length} registros`);
}
