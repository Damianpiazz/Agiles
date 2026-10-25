
import type { Request, Response } from "express";
import { z } from "zod";
import * as tipificacionService from "../services/tipificacionSanguinea.service";
import {
  crearTipificacionSanguineaSchema,
  idTipificacionSanguineaSchema,
} from "../types/tipificacionSanguinea.types";

export async function crear(req: Request, res: Response) {
  const parsed = crearTipificacionSanguineaSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const tipificacion = await tipificacionService.crear(parsed.data);
    return res.status(201).json(tipificacion);
  } catch (error) {
    if (error instanceof tipificacionService.DonacionNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    console.error("Error al registrar la tipificación sanguínea:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  const parsed = idTipificacionSanguineaSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de tipificación inválido" });
  }

  try {
    const tipificacion = await tipificacionService.buscarPorId(parsed.data);

    if (!tipificacion) {
      return res.status(404).json({ error: "Tipificación no encontrada" });
    }

    return res.status(200).json(tipificacion);
  } catch (error) {
    console.error("Error al consultar la tipificación sanguínea:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listarPorDonacion(req: Request, res: Response) {
  const parsed = idTipificacionSanguineaSchema.safeParse(
    req.params.donacionId,
  );

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de donación inválido" });
  }

  try {
    const tipificaciones = await tipificacionService.listarPorDonacion(
      parsed.data,
    );

    return res.status(200).json(tipificaciones);
  } catch (error) {
    console.error("Error al consultar el historial de tipificaciones:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
