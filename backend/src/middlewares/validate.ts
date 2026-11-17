import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Valida y reemplaza las partes del request indicadas. Los errores de Zod
 * son transformados por el manejador global en respuestas 422.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        // Express 5 define `query` como getter; guardamos el resultado validado
        // en un espacio propio para no romper el objeto original.
        (req as unknown as { validatedQuery: unknown }).validatedQuery = schemas.query.parse(req.query);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validatedQuery<T>(req: { validatedQuery?: unknown; query: T }): T {
  return (req.validatedQuery as T | undefined) ?? req.query;
}
