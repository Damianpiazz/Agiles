import type { PrismaClient } from "../../generated/prisma/client";

const antigenos = [
  "D", "C", "c", "E", "e", "K", "k", "Fy(a)", "Fy(b)", "Jk(a)", "Jk(b)", "M", "N", "S", "s", "Le(a)", "Le(b)", "P1",
];

export async function seed05Antigenos(prisma: PrismaClient) {
  for (const nombre of antigenos) {
    await prisma.antigeno.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log(`05-antigenos: ${antigenos.length} registros`);
}
