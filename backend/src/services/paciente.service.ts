import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../config/prisma";
import type {
  BuscarPacienteInput,
  CrearPacienteInput,
} from "../types/paciente.types";

export class PacienteDuplicadoError extends Error {
  constructor() {
    super("El paciente ya se encuentra registrado");
  }
}

export async function create(datos: CrearPacienteInput) {
  try {
    return await prisma.paciente.create({ data: datos });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new PacienteDuplicadoError();
    }

    throw error;
  }
}

export async function buscar(filtros: BuscarPacienteInput) {
  return prisma.paciente.findMany({
    where: {
      ...(filtros.dni ? { dni: filtros.dni } : {}),
      ...(filtros.nombre
        ? { nombre: { contains: filtros.nombre, mode: "insensitive" as const } }
        : {}),
      ...(filtros.apellido
        ? {
            apellido: {
              contains: filtros.apellido,
              mode: "insensitive" as const,
            },
          }
        : {}),
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}
