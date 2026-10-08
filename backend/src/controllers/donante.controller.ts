import type { Request, Response } from "express";
import { z } from "zod";
import * as donanteService from "../services/donante.service";
import { crearDonanteSchema } from "../types/donante.types";

export async function create(req: Request, res: Response) {
  const parsed = crearDonanteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }
  try {
    const donante = await donanteService.create(parsed.data);
    return res.status(201).json(donante);
  } catch (e) {
    if (e instanceof donanteService.DonanteDuplicadoError) {
      return res.status(409).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}