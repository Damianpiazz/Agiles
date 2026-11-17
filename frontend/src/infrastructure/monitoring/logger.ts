type Nivel = "info" | "warn" | "error";

function registrar(nivel: Nivel, mensaje: string, contexto?: Record<string, unknown>): void {
  if (import.meta.env.PROD && nivel === "info") return;
  const destino = nivel === "error" ? console.error : nivel === "warn" ? console.warn : console.info;
  destino(`[FLORHEMA] ${mensaje}`, contexto ?? {});
}

export const logger = {
  info: (mensaje: string, contexto?: Record<string, unknown>) => registrar("info", mensaje, contexto),
  warn: (mensaje: string, contexto?: Record<string, unknown>) => registrar("warn", mensaje, contexto),
  error: (mensaje: string, contexto?: Record<string, unknown>) => registrar("error", mensaje, contexto),
};
