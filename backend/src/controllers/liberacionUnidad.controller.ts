import type { Request, Response } from "express";
import { z } from "zod";

import {
  cambiarEstadoUnidadSchema,
  idDonacionUnidadSchema,
} from "../types/liberacionUnidad.types";

import * as liberacionService from "../services/liberacionUnidad.service";

export async function evaluar(req: Request, res: Response) {
  const id = idDonacionUnidadSchema.safeParse(
    req.params.donacionId,
  );

  if (!id.success) {
    return res.status(400).json({
      error: "ID de donación inválido",
    });
  }

  try {
    const evaluacion =
      await liberacionService.evaluarUnidad(id.data);

    return res.status(200).json(evaluacion);
  } catch (error) {
    if (
      error instanceof
      liberacionService.DonacionNoEncontradaError
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Error interno",
    });
  }
}

export async function cambiarEstado(
  req: Request,
  res: Response,
) {
  const id = idDonacionUnidadSchema.safeParse(
    req.params.donacionId,
  );

  if (!id.success) {
    return res.status(400).json({
      error: "ID de donación inválido",
    });
  }

  const parsed = cambiarEstadoUnidadSchema.safeParse(
    req.body,
  );

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const resultado =
      await liberacionService.cambiarEstadoUnidad(
        id.data,
        parsed.data,
      );

    return res.status(200).json(resultado);
  } catch (error) {
    if (
      error instanceof
      liberacionService.DonacionNoEncontradaError
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (
      error instanceof
      liberacionService.EstudiosIncompletosError
    ) {
      return res.status(409).json({
        error: error.message,
        evaluacion: error.evaluacion,
      });
    }

    if (
      error instanceof
      liberacionService.UnidadNoAptaError
    ) {
      return res.status(409).json({
        error: error.message,
        evaluacion: error.evaluacion,
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Error interno",
    });
  }
}