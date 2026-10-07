import { prisma } from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { CrearDonanteInput } from "../types/donante.types";

export class DonanteDuplicadoError extends Error {
  constructor() {
    super("El donante ya se encuentra registrado");
  }
}

export async function create(datos: CrearDonanteInput) {
  try {
    return await prisma.donante.create({
      data: { ...datos, telefonoFijo: datos.telefonoFijo || null },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new DonanteDuplicadoError();
    }
    throw e;
  }
}