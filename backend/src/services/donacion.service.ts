import { prisma } from "../config/prisma";
import type { CrearDonacionInput } from "../types/donacion.types";

export class DonanteNoEncontradoError extends Error {
  constructor() {
    super("El donante no existe");
  }
}

/**
 * Superficie mínima de Prisma que usa este servicio.
 * Se declara como parámetro inyectable para poder testear sin base de datos.
 */
export type DonacionDb = {
  donante: { findUnique(args: { where: { id: number } }): Promise<unknown> };
  donacion: {
    create(args: { data: unknown }): Promise<unknown>;
    findUnique(args: { where: { id: number } }): Promise<unknown>;
  };
  entrevistaPreDonacion: {
    findFirst(args: unknown): Promise<{ id: number; donacionId: number | null; resultadoAdmision: string } | null>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  $transaction<T>(callback: (tx: DonacionDb) => Promise<T>): Promise<T>;
};

export class EntrevistaPendienteNoEncontradaError extends Error {
  constructor() {
    super("El donante no tiene una entrevista pre-donación admitida pendiente.");
    this.name = "EntrevistaPendienteNoEncontradaError";
  }
}

export async function create(datos: CrearDonacionInput, db: DonacionDb = prisma) {
  const donante = await db.donante.findUnique({
    where: { id: datos.donanteId },
  });

  if (!donante) {
    throw new DonanteNoEncontradoError();
  }

  return db.$transaction(async (tx) => {
    const entrevista = await tx.entrevistaPreDonacion.findFirst({
      where: { donanteId: datos.donanteId },
      orderBy: { createdAt: "desc" },
      select: { id: true, donacionId: true, resultadoAdmision: true },
    });

    if (
      !entrevista ||
      entrevista.resultadoAdmision !== "ADMITIDO" ||
      entrevista.donacionId !== null
    ) {
      throw new EntrevistaPendienteNoEncontradaError();
    }

    const donacion = await tx.donacion.create({
      data: {
        donanteId: datos.donanteId,
        operador: datos.operador,
        peso: datos.peso || null,
        tensionArterial: datos.tensionArterial || null,
        hemoglobina: datos.hemoglobina || null,
        voluntario: datos.voluntario ?? false,
        reposicion: datos.reposicion ?? false,
        autoExcluido: datos.autoExcluido ?? false,
        observaciones: datos.observaciones || null,
        ...(datos.fechaHora ? { fechaHora: datos.fechaHora } : {}),
      },
    }) as { id: number };

    const vinculacion = await tx.entrevistaPreDonacion.updateMany({
      where: { id: entrevista.id, donacionId: null },
      data: { donacionId: donacion.id },
    });

    if (vinculacion.count !== 1) {
      throw new EntrevistaPendienteNoEncontradaError();
    }

    return { ...donacion, entrevistaId: entrevista.id };
  });
}

export async function buscarPorId(id: number, db: DonacionDb = prisma) {
  return db.donacion.findUnique({ where: { id } });
}
