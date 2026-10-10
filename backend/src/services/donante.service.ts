import { prisma } from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import type {
  CrearDonanteInput,
  BuscarDonanteInput,
} from "../types/donante.types";

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

export async function buscar(filtros: BuscarDonanteInput) {
  return prisma.donante.findMany({
    where: filtros.dni
      ? {
          dni: filtros.dni,
        }
      : {
          nombre: {
            contains: filtros.nombre,
            mode: "insensitive",
          },
          apellido: {
            contains: filtros.apellido,
            mode: "insensitive",
          },
        },
    orderBy: {
      apellido: "asc",
    },
  });
}

export async function buscarPorId(id: number) {
  return prisma.donante.findUnique({
    where: {
      id,
    },
    include: {
      entrevistas: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          resultadoAdmision: true,
          tipoDiferimiento: true,
          causaDiferimiento: true,
          entrevistador: true,
          createdAt: true,
        },
      },
    },
  });
}