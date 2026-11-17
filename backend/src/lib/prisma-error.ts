import { Prisma } from "../../generated/prisma/client";
import { AppError, conflict, notFound, unprocessable } from "./errors";

interface PrismaKnownError {
  code: string;
  meta?: Record<string, unknown>;
}

/**
 * Traduce los errores conocidos de Prisma a errores de aplicación con
 * mensajes en español y códigos HTTP coherentes.
 */
export function mapPrismaError(error: unknown): unknown {
  if (error instanceof AppError) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const known = error as unknown as PrismaKnownError;
    const target = Array.isArray(known.meta?.target)
      ? (known.meta?.target as string[]).join(", ")
      : String(known.meta?.target ?? "");

    switch (known.code) {
      case "P2002":
        return conflict(`Ya existe un registro con ese valor único${target ? ` (${target})` : ""}`);
      case "P2003":
        return conflict("No se puede completar la operación porque el registro está relacionado con otros datos");
      case "P2025":
        return notFound("El registro solicitado no existe");
      case "P2014":
        return conflict("La operación rompe una relación obligatoria entre registros");
      case "P2000":
        return unprocessable("Uno de los valores enviados es demasiado largo para la columna");
      default:
        return error;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return unprocessable("Los datos enviados no tienen el formato esperado por el modelo");
  }

  return error;
}
