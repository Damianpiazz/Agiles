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
};

export async function create(datos: CrearDonacionInput, db: DonacionDb = prisma) {
  const donante = await db.donante.findUnique({
    where: { id: datos.donanteId },
  });

  if (!donante) {
    throw new DonanteNoEncontradoError();
  }

  return db.donacion.create({
    data: {
      donanteId: datos.donanteId,
      operador: datos.operador,
      observaciones: datos.observaciones || null,
    },
  });
}

export async function buscarPorId(id: number, db: DonacionDb = prisma) {
  return db.donacion.findUnique({ where: { id } });
}
