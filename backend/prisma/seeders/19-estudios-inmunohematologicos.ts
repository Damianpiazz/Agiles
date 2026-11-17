import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  apellido,
  dni,
  entero,
  fechaReciente,
  nombre,
  observacion,
  operador,
  pick,
  resetFake,
} from "./_fake";

const conCeros = (numero: number) => String(numero).padStart(3, "0");

export async function seed19EstudiosInmunohematologicos(prisma: PrismaClient) {
  resetFake(119);

  for (let id = 1; id <= CANTIDAD; id++) {
    const gestante = {
      id,
      numero: id === 1 ? "GEST-001" : `GEST-${conCeros(id)}`,
      fecha: id === 1 ? new Date("2026-10-04") : fechaReciente(),
      operador: id === 1 ? null : operador(),
      idPersona: id === 1 ? 3 : entero(1, CANTIDAD),
    };

    await prisma.estudioInmunohematologicoGestante.upsert({
      where: { id },
      update: { ...gestante },
      create: gestante,
    });

    const vinculo = await prisma.pciInmunohematologicoGestante.findFirst({
      where: { idPci: id, idEstudiosInmunohematologicosGestante: id },
    });
    if (!vinculo) {
      await prisma.pciInmunohematologicoGestante.create({
        data: { idPci: id, idEstudiosInmunohematologicosGestante: id },
      });
    }
  }

  for (let id = 1; id <= CANTIDAD; id++) {
    const nacido = id === 1 ? "Ana Sosa" : `${nombre()} ${apellido()}`;
    const rn = {
      id,
      numero: id === 1 ? "RN-001" : `RN-${conCeros(id)}`,
      fecha: id === 1 ? new Date("2026-10-05") : fechaReciente(),
      rn: `RN de ${nacido}`,
      dni: id === 1 ? "60000001" : dni(),
      idMadre: id === 1 ? 3 : entero(1, CANTIDAD),
      idGrupoFactor: id === 1 ? 1 : entero(1, 8),
      ipAntiD: id === 1 ? "No aplica" : pick(["No aplica", "Aplicada", "Pendiente"]),
      idPcd: id,
      idPci: id,
      operador: id === 1 ? null : operador(),
      observaciones: id === 1 ? "Estudio RN demo" : observacion(),
    };

    await prisma.estudioInmunohematologicoRn.upsert({
      where: { id },
      update: { ...rn },
      create: rn,
    });
  }

  console.log(`19-estudios-inmunohematologicos: ${CANTIDAD} gestantes y ${CANTIDAD} recién nacidos`);
}
