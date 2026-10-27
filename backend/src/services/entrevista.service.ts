import { prisma } from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { CrearEntrevistaInput } from "../types/entrevista.types";
import { validarRespuestasSegunSexo } from "../types/entrevista.types";

export class DonanteNoEncontradoError extends Error {
  constructor() {
    super("Donante no encontrado");
  }
}

export class CuestionarioInvalidoError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function create(donanteId: number, datos: CrearEntrevistaInput) {
  const donante = await prisma.donante.findUnique({
    where: { id: donanteId },
  });

  if (!donante) {
    throw new DonanteNoEncontradoError();
  }

  const errorCuestionario = validarRespuestasSegunSexo(
    donante.sexoBiologico,
    datos.respuestas,
  );
  if (errorCuestionario) {
    throw new CuestionarioInvalidoError(errorCuestionario);
  }

  return prisma.entrevistaPreDonacion.create({
    data: {
      donanteId,
      donacionId: null,
      respuestas: datos.respuestas as Prisma.InputJsonValue,
      resultadoAdmision: datos.resultadoAdmision,
      tipoDiferimiento:
        datos.resultadoAdmision === "DIFERIDO" ? datos.tipoDiferimiento : null,
      causaDiferimiento:
        datos.resultadoAdmision === "DIFERIDO" ? datos.causaDiferimiento : null,
      entrevistador: datos.entrevistador,
    },
  });
}

export async function buscarPendiente(donanteId: number) {
  const ultimaEntrevista = await prisma.entrevistaPreDonacion.findFirst({
    where: { donanteId },
    orderBy: { createdAt: "desc" },
    select: { id: true, donacionId: true, resultadoAdmision: true },
  });

  if (
    ultimaEntrevista?.resultadoAdmision === "ADMITIDO" &&
    ultimaEntrevista.donacionId === null
  ) {
    return { entrevistaId: ultimaEntrevista.id };
  }

  return null;
}
