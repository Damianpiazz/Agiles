export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get esDeRed(): boolean {
    return this.status === 0;
  }
}

export const UNAUTHORIZED_EVENT = "florhema:unauthorized";

export function notificarSesionCaducada(): void {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No se pudo completar la operación. Reintentá.";
}
