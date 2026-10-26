import type { Request, Response } from "express";
import { z } from "zod";
import * as tamizajeService from "../services/tamizajeInfecciones.service";
import {
  crearTamizajeInfeccionesSchema,
  idTamizajeInfeccionesSchema,
} from "../types/tamizajeInfecciones.types";

export async function crear(req: Request, res: Response) {
  const parsed = crearTamizajeInfeccionesSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const tamizaje = await tamizajeService.crear(parsed.data);
    return res.status(201).json(tamizaje);
  } catch (error) {
    if (error instanceof tamizajeService.DonacionNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof tamizajeService.CatalogoTamizajeInvalidoError) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error al registrar el tamizaje de infecciones:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listarPorDonacion(req: Request, res: Response) {
  const parsed = idTamizajeInfeccionesSchema.safeParse(req.params.donacionId);
  if (!parsed.success) {
    return res.status(400).json({ error: "ID de donación inválido" });
  }

  try {
    const tamizajes = await tamizajeService.listarPorDonacion(parsed.data);
    return res.status(200).json(tamizajes);
  } catch (error) {
    console.error("Error al consultar el historial de tamizajes:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
