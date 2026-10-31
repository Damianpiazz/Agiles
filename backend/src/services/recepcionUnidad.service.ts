import { prisma } from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { CrearRecepcionUnidadInput } from "../types/recepcionUnidad.types";

export class UnidadDuplicadaError extends Error {
  constructor() {
    super("La unidad ya se encuentra registrada");
    this.name = "UnidadDuplicadaError";
  }
}

export type RecepcionUnidadDb = {
  unidadSangre: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
  };
};

const dbPredeterminada = prisma as unknown as RecepcionUnidadDb;

export async function create(
  datos: CrearRecepcionUnidadInput,
  db: RecepcionUnidadDb = dbPredeterminada,
) {
  try {
    return await db.unidadSangre.create({
      data: {
        numeroUnidad: datos.numeroUnidad,
        tipoHemocomponente: datos.tipoHemocomponente,
        grupoABO: datos.grupoABO,
        factorRhD: datos.factorRhD,
        fechaVencimiento: datos.fechaVencimiento,
        estado: datos.estado,
        operador: datos.operador,
        fechaRecepcion: new Date(),
      },
    });
  } catch (e) {
    if (
      (e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002") ||
      (typeof e === "object" && e !== null && "code" in e && e.code === "P2002")
    ) {
      throw new UnidadDuplicadaError();
    }
    throw e;
  }
}

export async function listar(db: RecepcionUnidadDb = dbPredeterminada) {
  return db.unidadSangre.findMany({
    orderBy: [{ fechaRecepcion: "desc" }, { id: "desc" }],
  });
}
