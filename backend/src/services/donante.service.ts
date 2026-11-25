import { prisma } from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import type {
  CrearDonanteInput,
  ActualizarDonanteInput,
  BuscarDonanteInput,
} from "../types/donante.types";

export class DonanteDuplicadoError extends Error {
  constructor() {
    super("El donante ya se encuentra registrado");
  }
}

export class DonanteNoEncontradoError extends Error {
  constructor() {
    super("Donante no encontrado");
  }
}

const includeDonaciones = {
  donaciones: {
    orderBy: {
      fechaHora: "desc" as const,
    },
    select: {
      id: true,
      fechaHora: true,
      estado: true,
      operador: true,
      peso: true,
      tensionArterial: true,
      hemoglobina: true,
      voluntario: true,
      reposicion: true,
      autoExcluido: true,
      observaciones: true,
      entrevista: {
        select: {
          id: true,
          resultadoAdmision: true,
          tipoDiferimiento: true,
          causaDiferimiento: true,
          entrevistador: true,
          respuestas: true,
          createdAt: true,
        },
      },
      anticuerpoIrregular: {
        select: {
          id: true,
          resultado: true,
          operador: true,
          fechaHora: true,
          observacion: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
};

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

export async function actualizar(id: number, datos: ActualizarDonanteInput) {
  try {
    return await prisma.donante.update({
      where: { id },
      data: {
        domicilio: datos.domicilio,
        codigoPostal: datos.codigoPostal,
        email: datos.email,
        telefonoFijo: datos.telefonoFijo || null,
        telefonoCelular: datos.telefonoCelular,
        operadorModificacion: datos.operador,
      },
      include: includeDonaciones,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new DonanteNoEncontradoError();
    }
    throw e;
  }
}

export async function buscar(filtros: BuscarDonanteInput) {
  return prisma.donante.findMany({
    where: {
      activo: true,
      ...(filtros.dni
        ? { dni: filtros.dni }
        : {
            nombre: {
              contains: filtros.nombre,
              mode: "insensitive",
            },
            apellido: {
              contains: filtros.apellido,
              mode: "insensitive",
            },
          }),
    },
    orderBy: {
      apellido: "asc",
    },
  });
}

/** Listado completo de donantes activos para tablas con filtros y paginación. */
export async function listarActivos() {
  return prisma.donante.findMany({
    where: { activo: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}

/** Baja temporal: mantiene el historial y excluye al donante de las búsquedas. */
export async function darDeBaja(id: number) {
  try {
    return await prisma.donante.update({
      where: { id },
      data: { activo: false },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new DonanteNoEncontradoError();
    }
    throw e;
  }
}

export async function buscarPorId(id: number) {
  return prisma.donante.findUnique({
    where: {
      id,
    },
    include: includeDonaciones,
  });
}
