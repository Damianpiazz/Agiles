import type { Request, Response } from "express";
import { z } from "zod";
import * as anticuerpoIrregularService from "../services/anticuerpoIrregular.service";
import {
  idAnticuerpoIrregularSchema,
  registrarAnticuerpoIrregularSchema,
} from "../types/anticuerpoIrregular.types";

export async function registrar(req: Request, res: Response) {
  const parsed = registrarAnticuerpoIrregularSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const registro = await anticuerpoIrregularService.registrarResultado(
      parsed.data,
    );

    return res.status(201).json(registro);
  } catch (error) {
    if (error instanceof anticuerpoIrregularService.DonacionNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    if (
      error instanceof
      anticuerpoIrregularService.CalificacionBiologicaNoIniciadaError
    ) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error al registrar anticuerpos irregulares:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  const parsed = idAnticuerpoIrregularSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de registro inválido" });
  }

  try {
    const registro = await anticuerpoIrregularService.buscarPorId(parsed.data);

    if (!registro) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    return res.status(200).json(registro);
  } catch (error) {
    console.error("Error al consultar el resultado:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listarPorDonacion(req: Request, res: Response) {
  const parsed = idAnticuerpoIrregularSchema.safeParse(req.params.donacionId);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de donación inválido" });
  }

  try {
    const registros = await anticuerpoIrregularService.listarPorDonacion(
      parsed.data,
    );

    return res.status(200).json(registros);
  } catch (error) {
    console.error("Error al consultar anticuerpos irregulares:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
