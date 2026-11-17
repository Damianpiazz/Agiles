import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env";
import { forbidden, unauthorized } from "../lib/errors";
import { verifyToken } from "../lib/security";
import type { RolUsuario } from "../../generated/prisma/enums";

export interface AuthUser {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const DEV_USER: AuthUser = {
  id: 0,
  usuario: "sistema",
  nombre: "Sistema",
  apellido: "Desarrollo",
  rol: "ADMINISTRADOR" as RolUsuario,
};

/**
 * Lee el token Bearer si está presente. No rechaza requests: eso lo decide
 * `requireAuth`, de modo que algunos endpoints públicos puedan funcionar
 * sin credenciales.
 */
export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice("Bearer ".length).trim());
    if (payload) {
      req.user = {
        id: payload.sub,
        usuario: payload.usuario,
        nombre: "",
        apellido: "",
        rol: payload.rol as RolUsuario,
      };
    }
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (req.user) return next();
  if (!env.authRequired) {
    req.user = DEV_USER;
    return next();
  }
  next(unauthorized("Necesitás iniciar sesión para acceder a este recurso"));
};

export function requireRole(...roles: RolUsuario[]): RequestHandler {
  return (req, _res, next) => {
    if (!env.authRequired && !req.user) {
      req.user = DEV_USER;
      return next();
    }
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.rol)) {
      return next(forbidden("Tu rol no tiene permisos para esta operación"));
    }
    next();
  };
}

export { DEV_USER };
