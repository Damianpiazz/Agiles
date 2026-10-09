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

  return prisma.$transaction(async (tx) => {
    const donacion = await tx.donacion.create({
      data: { donanteId },
    });

    return tx.entrevistaPreDonacion.create({
      data: {
        donanteId,
        donacionId: donacion.id,
        respuestas: datos.respuestas as Prisma.InputJsonValue,
      },
    });
  });
}
