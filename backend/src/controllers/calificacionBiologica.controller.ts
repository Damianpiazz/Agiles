import type { Request, Response } from "express";
import { z } from "zod";
import * as calificacionService from "../services/calificacionBiologica.service";
import * as anticuerpoIrregularService from "../services/anticuerpoIrregular.service";

const iniciarSchema = z.object({
  donacionId: z.number().int().positive(),
  operador: z.string().trim().min(1).max(120),
});

const registrarAnticuerposIrregularesSchema = z.object({
  resultado: z.enum(["POSITIVO", "NEGATIVO"]),
  operador: z.string().trim().min(1).max(120),
  observacion: z.string().trim().max(500).optional(),
});

export async function iniciar(req: Request, res: Response) {
  const parsed = iniciarSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const resultado = await calificacionService.iniciar(
      parsed.data.donacionId,
      parsed.data.operador,
    );

    return res.status(resultado.creada ? 201 : 200).json(resultado);
  } catch (error) {
    if (error instanceof calificacionService.DonacionNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof calificacionService.DonacionBloqueadaError) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error al iniciar la calificación biológica:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function registrarAnticuerposIrregulares(
  req: Request,
  res: Response,
) {
  const parsed = registrarAnticuerposIrregularesSchema.safeParse(req.body);
  const donacionId = Number(req.params.donacionId ?? req.body.donacionId);

  if (!Number.isInteger(donacionId) || donacionId <= 0) {
    return res.status(400).json({ error: "ID de donación inválido" });
  }

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const resultado = await anticuerpoIrregularService.registrarResultado({
      donacionId,
      resultado: parsed.data.resultado,
      operador: parsed.data.operador,
      observacion: parsed.data.observacion,
    });

    return res.status(201).json(resultado);
  } catch (error) {
    if (
      error instanceof anticuerpoIrregularService.DonacionNoEncontradaError
    ) {
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
