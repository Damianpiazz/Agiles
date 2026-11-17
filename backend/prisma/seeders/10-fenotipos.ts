import type { PrismaClient } from "../../generated/prisma/client";

export async function seed10Fenotipos(prisma: PrismaClient) {
  const data = [
    { id: 1, nombre: "Ccee" },
    { id: 2, nombre: "ccEe" },
    { id: 3, nombre: "K-" },
  ];

  for (const item of data) {
    await prisma.fenotipo.upsert({ where: { id: item.id }, update: { nombre: item.nombre }, create: item });
  }
  console.log(`10-fenotipos: ${data.length} registros`);
}
