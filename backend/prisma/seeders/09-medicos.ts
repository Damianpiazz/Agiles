import type { PrismaClient } from "../../generated/prisma/client";

export async function seed09Medicos(prisma: PrismaClient) {
  const data = [
    { id: 1, nombre: "Dra. María López" },
    { id: 2, nombre: "Dr. Juan Pérez" },
  ];

  for (const item of data) {
    await prisma.medico.upsert({ where: { id: item.id }, update: { nombre: item.nombre }, create: item });
  }
  console.log(`09-medicos: ${data.length} registros`);
}
