import { prisma } from "../config/prisma";
import type { DarDeBajaUnidadInput } from "../types/bajaUnidad.types";

export class UnidadNoEncontradaError extends Error {
  constructor() {
    super("La unidad de sangre no existe.");
    this.name = "UnidadNoEncontradaError";
  }
}

export class UnidadYaDadaDeBajaError extends Error {
  constructor() {
    super("La unidad ya fue dada de baja.");
    this.name = "UnidadYaDadaDeBajaError";
  }
}

export class MotivoBajaNoPermitidoParaUnidadEmitidaError extends Error {
  constructor() {
    super(
      "Una unidad emitida solo puede darse de baja con motivo TRANSFUNDIDA o DESCARTADA.",
    );
    this.name = "MotivoBajaNoPermitidoParaUnidadEmitidaError";
  }
}

export type BajaUnidadDb = {
  unidadSangre: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
};

const dbPredeterminada = prisma as unknown as BajaUnidadDb;

/**
 * Da de baja una unidad del inventario. La baja es terminal: el estado pasa a
 * DADA_DE_BAJA y se conserva el motivo, el usuario y la fecha/hora para la
 * trazabilidad de la disposición final.
 */
export async function darDeBaja(
  id: number,
  datos: DarDeBajaUnidadInput,
  db: BajaUnidadDb = dbPredeterminada,
) {
  const unidad = await db.unidadSangre.findUnique({ where: { id } });

  if (!unidad) {
    throw new UnidadNoEncontradaError();
  }

  if (unidad.estado === "DADA_DE_BAJA") {
    throw new UnidadYaDadaDeBajaError();
  }

  if (
    unidad.estado === "EMITIDA" &&
    datos.motivo !== "TRANSFUNDIDA" &&
    datos.motivo !== "DESCARTADA"
  ) {
    throw new MotivoBajaNoPermitidoParaUnidadEmitidaError();
  }

  return db.unidadSangre.update({
    where: { id },
    data: {
      estado: "DADA_DE_BAJA",
      motivoBaja: datos.motivo,
      operadorBaja: datos.operador,
      fechaBaja: new Date(),
    },
  });
}
