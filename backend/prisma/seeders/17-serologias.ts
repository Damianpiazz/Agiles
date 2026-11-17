import type { PrismaClient } from "../../generated/prisma/client";

export async function seed17Serologias(prisma: PrismaClient) {
  const fecha = new Date("2026-10-02");
  const hora = new Date("1970-01-01T11:00:00Z");

  await prisma.serologia.upsert({
    where: { id: 1 },
    update: { fecha, hora, observaciones: "Serología demo" },
    create: { id: 1, fecha, hora, observaciones: "Serología demo" },
  });

  await prisma.serologiaDonacion.upsert({
    where: { serologiaId_donacionId: { serologiaId: 1, donacionId: 1 } },
    update: {},
    create: { serologiaId: 1, donacionId: 1 },
  });

  const existenteDer = await prisma.serologiaDonacionDer.findFirst({ where: { idSerologia: 1, idDonacion: 1 } });
  if (!existenteDer) {
    await prisma.serologiaDonacionDer.create({ data: { idSerologia: 1, idDonacion: 1 } });
  }

  const det = await prisma.determinacionSerologica.findUnique({ where: { nombre: "Anti-VIH 1/2" } });
  if (det) {
    await prisma.serologiaResultado.upsert({
      where: { serologiaId_determinacionSerologicaId: { serologiaId: 1, determinacionSerologicaId: det.id } },
      update: { resultado: "NO_REACTIVO", valor: null, unidad: null, observacion: "Seed demo" },
      create: { serologiaId: 1, determinacionSerologicaId: det.id, resultado: "NO_REACTIVO", observacion: "Seed demo" },
    });
  }

  console.log("17-serologias: 1 serología, vínculos y resultados demo");
}
