import type { PrismaClient } from "../../generated/prisma/client";

const determinaciones = [
  "Anti-T. cruzi",
  "HBsAg",
  "Anti-core HB",
  "Anti-HCV",
  "Anti-VIH 1/2",
  "Anti-Treponema pallidum",
  "Anti-HTLV I/II",
];

export async function seed06DeterminacionesSerologicas(prisma: PrismaClient) {
  for (const nombre of determinaciones) {
    await prisma.determinacionSerologica.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log(`06-determinaciones-serologicas: ${determinaciones.length} registros`);
}
