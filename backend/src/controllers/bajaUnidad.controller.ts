import type { Request, Response } from "express";
import { z } from "zod";
import * as bajaUnidadService from "../services/bajaUnidad.service";
import { darDeBajaUnidadSchema } from "../types/bajaUnidad.types";

export async function darDeBaja(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Identificador de unidad inválido" });
  }

  const parsed = darDeBajaUnidadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const unidad = await bajaUnidadService.darDeBaja(id, parsed.data);
    return res.status(200).json(unidad);
  } catch (e) {
    if (e instanceof bajaUnidadService.UnidadNoEncontradaError) {
      return res.status(404).json({ error: e.message });
    }
    if (e instanceof bajaUnidadService.UnidadYaDadaDeBajaError) {
      return res.status(409).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
