import type { PrismaClient } from "../../generated/prisma/client";

export async function seed11TiposTransfusion(prisma: PrismaClient) {
  const data = [
    { id: 1, nombre: "Transfusión simple" },
    { id: 2, nombre: "Exanguinotransfusión" },
    { id: 3, nombre: "Transfusión masiva" },
  ];

  for (const item of data) {
    await prisma.tipoTransfusion.upsert({ where: { id: item.id }, update: { nombre: item.nombre }, create: item });
  }
  console.log(`11-tipos-transfusion: ${data.length} registros`);
}
