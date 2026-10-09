import type { Request, Response } from "express";
import { z } from "zod";
import * as donacionService from "../services/donacion.service";
import { crearDonacionSchema, idDonacionSchema } from "../types/donacion.types";

export async function create(req: Request, res: Response) {
  const parsed = crearDonacionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const donacion = await donacionService.create(parsed.data);
    return res.status(201).json(donacion);
  } catch (e) {
    if (e instanceof donacionService.DonanteNoEncontradoError) {
      return res.status(404).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function getById(req: Request, res: Response) {
  const parsed = idDonacionSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de donación inválido" });
  }

  try {
    const donacion = await donacionService.buscarPorId(parsed.data);

    if (!donacion) {
      return res.status(404).json({ error: "Donación no encontrada" });
    }

    return res.status(200).json(donacion);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
