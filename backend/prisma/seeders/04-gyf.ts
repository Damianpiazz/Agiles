import type { PrismaClient } from "../../generated/prisma/client";

export async function seed04Gyf(prisma: PrismaClient) {
  const data = [
    { id: 1, grupo: "A", factor: "POSITIVO" },
    { id: 2, grupo: "A", factor: "NEGATIVO" },
    { id: 3, grupo: "B", factor: "POSITIVO" },
    { id: 4, grupo: "B", factor: "NEGATIVO" },
    { id: 5, grupo: "AB", factor: "POSITIVO" },
    { id: 6, grupo: "AB", factor: "NEGATIVO" },
    { id: 7, grupo: "O", factor: "POSITIVO" },
    { id: 8, grupo: "O", factor: "NEGATIVO" },
  ];

  for (const gyf of data) {
    await prisma.gyf.upsert({
      where: { id: gyf.id },
      update: { grupo: gyf.grupo, factor: gyf.factor },
      create: gyf,
    });
  }

  console.log(`04-gyf: ${data.length} registros`);
}
