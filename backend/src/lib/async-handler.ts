import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envuelve controladores async para que cualquier rechazo llegue al
 * middleware de errores. Express 5 ya lo hace, pero explicitarlo mantiene
 * los controladores legibles y compatibles con versiones anteriores.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}
