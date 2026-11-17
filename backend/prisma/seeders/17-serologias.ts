import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  booleano,
  fechaReciente,
  hora,
  muestra,
  observacion,
  operador,
  pick,
  resetFake,
} from "./_fake";

export async function seed17Serologias(prisma: PrismaClient) {
  resetFake(117);

  const determinaciones = await prisma.determinacionSerologica.findMany({ select: { id: true, nombre: true } });
  const antiVih = determinaciones.find((determinacion) => determinacion.nombre === "Anti-VIH 1/2");

  for (let id = 1; id <= CANTIDAD; id++) {
    const serologia = {
      id,
      fecha: id === 1 ? new Date("2026-10-02") : fechaReciente(),
      hora: id === 1 ? new Date("1970-01-01T11:00:00Z") : hora(),
      tipoMuestra: id === 1 ? null : pick(["PRIMERA", "SEGUNDA"] as const),
      operador: id === 1 ? null : operador(),
      observaciones: id === 1 ? "Serología demo" : observacion(),
    };

    await prisma.serologia.upsert({
      where: { id },
      update: { ...serologia },
      create: serologia,
    });

    await prisma.serologiaDonacion.upsert({
      where: { serologiaId_donacionId: { serologiaId: id, donacionId: id } },
      update: {},
      create: { serologiaId: id, donacionId: id },
    });

    const existenteDer = await prisma.serologiaDonacionDer.findFirst({
      where: { idSerologia: id, idDonacion: id },
    });
    if (!existenteDer) {
      await prisma.serologiaDonacionDer.create({ data: { idSerologia: id, idDonacion: id } });
    }

    const elegidas = id === 1 && antiVih ? [antiVih] : muestra(determinaciones, 1, 3);
    for (const determinacion of elegidas) {
      const resultado = id === 1 ? "NO_REACTIVO" : booleano(0.15) ? "REACTIVO" : "NO_REACTIVO";
      const detalle = {
        resultado,
        valor: null as string | null,
        unidad: null as string | null,
        observacion: id === 1 ? "Seed demo" : observacion(),
      };

      await prisma.serologiaResultado.upsert({
        where: {
          serologiaId_determinacionSerologicaId: {
            serologiaId: id,
            determinacionSerologicaId: determinacion.id,
          },
        },
        update: detalle,
        create: {
          serologiaId: id,
          determinacionSerologicaId: determinacion.id,
          ...detalle,
        },
      });
    }
  }

  console.log(`17-serologias: ${CANTIDAD} serologías, vínculos y resultados`);
}
