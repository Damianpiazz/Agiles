import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "RUTA_NO_ENCONTRADA",
      message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    },
  });
};
