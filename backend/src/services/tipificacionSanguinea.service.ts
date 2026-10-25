
import { prisma } from "../config/prisma";
import type { CrearTipificacionSanguineaInput } from "../types/tipificacionSanguinea.types";

export class DonacionNoEncontradaError extends Error {
  constructor() {
    super("La donación no existe.");
    this.name = "DonacionNoEncontradaError";
  }
}

type TipificacionDb = {
  donacion: {
    findUnique: (args: any) => Promise<any>;
  };
  tipificacionSanguinea: {
    create: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
  };
};

const dbPredeterminada = prisma as unknown as TipificacionDb;

export async function crear(
  datos: CrearTipificacionSanguineaInput,
  db: TipificacionDb = dbPredeterminada,
) {
  const donacion = await db.donacion.findUnique({
    where: { id: datos.donacionId },
  });

  if (!donacion) {
    throw new DonacionNoEncontradaError();
  }

  return db.tipificacionSanguinea.create({
    data: {
      donacionId: datos.donacionId,
      grupoABO: datos.grupoABO,
      factorRhD: datos.factorRhD,
      operador: datos.operador,
    },
    include: {
      donacion: {
        include: {
          donante: true,
        },
      },
    },
  });
}

export async function buscarPorId(
  id: number,
  db: TipificacionDb = dbPredeterminada,
) {
  return db.tipificacionSanguinea.findUnique({
    where: { id },
    include: {
      donacion: {
        include: {
          donante: true,
        },
      },
    },
  });
}

export async function listarPorDonacion(
  donacionId: number,
  db: TipificacionDb = dbPredeterminada,
) {
  return db.tipificacionSanguinea.findMany({
    where: { donacionId },
    orderBy: { fechaHora: "desc" },
  });
}
