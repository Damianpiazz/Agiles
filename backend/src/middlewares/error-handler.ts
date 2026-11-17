import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../lib/errors";
import { mapPrismaError } from "../lib/prisma-error";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function zodDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    campo: issue.path.length ? issue.path.join(".") : "(raíz)",
    mensaje: issue.message,
    codigo: issue.code,
  }));
}

/**
 * Maneja de forma centralizada todos los errores de la API.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;

  if (error instanceof ZodError) {
    const body: ErrorBody = {
      error: {
        code: "DATOS_INVALIDOS",
        message: "La solicitud contiene datos inválidos",
        details: zodDetails(error),
      },
    };
    res.status(422).json(body);
    return;
  }

  if (error instanceof AppError) {
    const body: ErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    };
    res.status(error.statusCode).json(body);
    return;
  }

  const mapped = mapPrismaError(error);
  if (mapped instanceof AppError) {
    res.status(mapped.statusCode).json({
      error: {
        code: mapped.code,
        message: mapped.message,
        ...(mapped.details !== undefined ? { details: mapped.details } : {}),
      },
    } as ErrorBody);
    return;
  }

  // Errores de parseo de JSON emitidos por express.json().
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      error: { code: "JSON_INVALIDO", message: "El cuerpo del request no es un JSON válido" },
    } satisfies ErrorBody);
    return;
  }

  if (env.nodeEnv !== "production") {
    console.error("Error no controlado:", error);
  }

  res.status(500).json({
    error: {
      code: "ERROR_INTERNO",
      message: "Ocurrió un error inesperado en el servidor",
    },
  } satisfies ErrorBody);
};
