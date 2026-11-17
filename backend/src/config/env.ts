import "dotenv/config";

/**
 * Normaliza variables de entorno booleanas ("true", "1", "yes").
 */
function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "si", "sí"].includes(value.toLowerCase());
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3000),
  frontendUrl: process.env.FRONTEND_URL ?? "*",
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** Permite exigir autenticación en todos los endpoints de escritura. */
  authRequired: toBoolean(process.env.AUTH_REQUIRED, false),
  /** Secreto usado para firmar los tokens HMAC. */
  authSecret: process.env.AUTH_SECRET ?? "florhema-dev-secret",
  /** Horas de vigencia del token. */
  authTokenTtlHours: toNumber(process.env.AUTH_TOKEN_TTL_HOURS, 12),
  /** Activa el registro automático de mutaciones en auditoría. */
  auditEnabled: toBoolean(process.env.AUDIT_ENABLED, true),
  /** Registra cada request en consola. */
  requestLogging: toBoolean(process.env.REQUEST_LOGGING, true),
} as const;

export const isProduction = env.nodeEnv === "production";
