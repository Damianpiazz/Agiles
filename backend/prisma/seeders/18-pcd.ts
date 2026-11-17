import type { PrismaClient } from "../../generated/prisma/client";

export async function seed18Pcd(prisma: PrismaClient) {
  const fecha = new Date("2026-10-03");
  const hora = new Date("1970-01-01T09:15:00Z");

  await prisma.pcd.upsert({
    where: { id: 1 },
    update: { fecha, hora, observaciones: "PCD demo" },
    create: { id: 1, fecha, hora, observaciones: "PCD demo" },
  });

  const det = await prisma.determinacionPcd.findUnique({ where: { nombre: "Coombs Directo" } });
  if (det) {
    const existente = await prisma.pcdResultado.findFirst({ where: { idPcd: 1, idDeterminacionPcd: det.id } });
    if (existente) {
      await prisma.pcdResultado.update({
        where: { id: existente.id },
        data: { resultado: "NEGATIVO", observacion: "Seed demo" },
      });
    } else {
      await prisma.pcdResultado.create({
        data: { idPcd: 1, idDeterminacionPcd: det.id, resultado: "NEGATIVO", observacion: "Seed demo" },
      });
    }
  }

  console.log("18-pcd: 1 PCD y resultados demo");
}
