import type { Request, Response } from "express";
import { z } from "zod";
import * as recepcionUnidadService from "../services/recepcionUnidad.service";
import { crearRecepcionUnidadSchema } from "../types/recepcionUnidad.types";

export async function create(req: Request, res: Response) {
  const parsed = crearRecepcionUnidadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const unidad = await recepcionUnidadService.create(parsed.data);
    return res.status(201).json(unidad);
  } catch (e) {
    if (e instanceof recepcionUnidadService.UnidadDuplicadaError) {
      return res.status(409).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listar(_req: Request, res: Response) {
  try {
    const unidades = await recepcionUnidadService.listar();
    return res.status(200).json(unidades);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
