import type { Request, Response } from "express";
import { z } from "zod";
import * as dashboardService from "../services/dashboard.service";
import { dashboardFiltrosSchema } from "../types/dashboard.types";

export async function resumen(req: Request, res: Response) {
  const parsed = dashboardFiltrosSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Filtros inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    return res.status(200).json(await dashboardService.obtenerSnapshot(parsed.data));
  } catch (error) {
    console.error("Error al consultar el resumen del dashboard:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
