/**
 * Error de aplicación con código HTTP y código de negocio.
 * El manejador global lo transforma al formato `{ error: { code, message } }`.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(400, "SOLICITUD_INVALIDA", message, details);
}

export function unauthorized(message = "Credenciales inválidas o token ausente"): AppError {
  return new AppError(401, "NO_AUTORIZADO", message);
}

export function forbidden(message = "No tenés permisos para realizar esta acción"): AppError {
  return new AppError(403, "PROHIBIDO", message);
}

export function notFound(message = "Recurso no encontrado"): AppError {
  return new AppError(404, "NO_ENCONTRADO", message);
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError(409, "CONFLICTO", message, details);
}

export function unprocessable(message: string, details?: unknown): AppError {
  return new AppError(422, "DATOS_INVALIDOS", message, details);
}
