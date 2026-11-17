import type { PrismaClient } from "../../generated/prisma/client";

const determinaciones = ["Coombs Directo", "Eluato", "Autoanticuerpos"];

export async function seed07DeterminacionesPcd(prisma: PrismaClient) {
  for (const nombre of determinaciones) {
    await prisma.determinacionPcd.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  console.log(`07-determinaciones-pcd: ${determinaciones.length} registros`);
}
