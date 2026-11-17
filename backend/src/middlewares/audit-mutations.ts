import type { RequestHandler } from "express";
import { env } from "../config/env";
import { registrarAuditoria, resumirBody } from "../lib/audit";

const ACTION_BY_METHOD: Record<string, string> = {
  POST: "ALTA",
  PUT: "EDICION",
  PATCH: "EDICION",
  DELETE: "BAJA",
};

function entityFromPath(path: string): { entidad: string; entidadId?: string } {
  const withoutPrefix = path.replace(/^\/api\/v\d+\//, "");
  const segments = withoutPrefix.split("/").filter(Boolean);
  const entidad = segments[0] ?? "desconocido";
  const idIndex = segments.findIndex((segment) => /^\d+$/.test(segment));
  return { entidad, entidadId: idIndex >= 0 ? segments[idIndex] : undefined };
}

/**
 * Audita automáticamente toda mutación exitosa sobre `/api/v1`.
 * Se engancha al evento `finish` para no demorar la respuesta.
 */
export const auditMutations: RequestHandler = (req, res, next) => {
  if (!env.auditEnabled) return next();
  const action = ACTION_BY_METHOD[req.method];
  if (!action || !req.originalUrl.startsWith("/api/")) return next();

  res.on("finish", () => {
    if (res.statusCode >= 400) return;
    const { entidad, entidadId } = entityFromPath(req.path);
    const idFromParams = Array.isArray(req.params?.id) ? req.params.id[0] : req.params?.id;
    // El usuario de desarrollo (id 0) no existe en la tabla `usuarios`.
    const idUsuario = req.user?.id && req.user.id > 0 ? req.user.id : null;
    void registrarAuditoria({
      idUsuario,
      usuario: req.user?.usuario ?? "anonimo",
      accion: action,
      entidad,
      entidadId: idFromParams ?? entidadId ?? null,
      detalle: resumirBody(req.body),
      metodo: req.method,
      ruta: req.originalUrl,
      ip: req.ip ?? null,
    });
  });

  next();
};
