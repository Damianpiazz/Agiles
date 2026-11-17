import { prisma } from "../config/prisma";

export interface AuditEntry {
  idUsuario?: number | null;
  usuario?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: string | null;
  metodo?: string | null;
  ruta?: string | null;
  ip?: string | null;
}

/**
 * Registra una acción en la tabla de auditoría. Nunca debe romper la
 * operación principal: los errores se registran en consola y se descartan.
 */
export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        idUsuario: entry.idUsuario ?? null,
        usuario: entry.usuario ?? null,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId ?? null,
        detalle: entry.detalle ?? null,
        metodo: entry.metodo ?? null,
        ruta: entry.ruta ?? null,
        ip: entry.ip ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar la auditoría:", error);
  }
}

const SENSITIVE_KEYS = ["password", "contrasena", "contraseña", "passwordHash", "token"];

export function resumirBody(body: unknown, maxLength = 500): string | null {
  if (!body || typeof body !== "object") return null;
  try {
    const clone = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
    for (const key of Object.keys(clone)) {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        clone[key] = "***";
      }
    }
    const text = JSON.stringify(clone);
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  } catch {
    return null;
  }
}
