import type { PrismaClient } from "../../generated/prisma/client";
import { CANTIDAD, booleano, fechaReciente, hora, muestra, observacion, operador, resetFake } from "./_fake";

export async function seed18Pcd(prisma: PrismaClient) {
  resetFake(118);

  const determinaciones = await prisma.determinacionPcd.findMany({ select: { id: true, nombre: true } });
  const coombs = determinaciones.find((determinacion) => determinacion.nombre === "Coombs Directo");

  for (let id = 1; id <= CANTIDAD; id++) {
    const pcd = {
      id,
      fecha: id === 1 ? new Date("2026-10-03") : fechaReciente(),
      hora: id === 1 ? new Date("1970-01-01T09:15:00Z") : hora(),
      operador: id === 1 ? null : operador(),
      observaciones: id === 1 ? "PCD demo" : observacion(),
    };

    await prisma.pcd.upsert({
      where: { id },
      update: { ...pcd },
      create: pcd,
    });

    const elegidas = id === 1 && coombs ? [coombs] : muestra(determinaciones, 1, 3);
    for (const determinacion of elegidas) {
      const detalle = {
        resultado: id === 1 ? "NEGATIVO" : booleano(0.15) ? "POSITIVO" : "NEGATIVO",
        valor: null as string | null,
        unidad: null as string | null,
        observacion: id === 1 ? "Seed demo" : observacion(),
        idPcd: id,
        idDeterminacionPcd: determinacion.id,
      };

      const existente = await prisma.pcdResultado.findFirst({
        where: { idPcd: id, idDeterminacionPcd: determinacion.id },
      });
      if (existente) {
        await prisma.pcdResultado.update({ where: { id: existente.id }, data: detalle });
      } else {
        await prisma.pcdResultado.create({ data: detalle });
      }
    }
  }

  console.log(`18-pcd: ${CANTIDAD} PCDs y resultados`);
}
