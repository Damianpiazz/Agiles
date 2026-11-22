
import type { Request, Response } from "express";
import { z } from "zod";

import * as estudioService from "../services/estudioPretransfusional.service";

import {
  crearEstudioPretransfusionalSchema,
  idSolicitudEstudioSchema,
} from "../types/estudioPretransfusional.types";

// Traduce los errores del servicio a respuestas HTTP.

function responderError(error: unknown, res: Response) {
  if (
    error instanceof estudioService.SolicitudEstudioNoEncontradaError ||
    error instanceof estudioService.UnidadEstudioNoEncontradaError
  ) {
    return res.status(404).json({
      error: error.message,
    });
  }

  if (
    error instanceof estudioService.SolicitudEstudioSinPacienteError ||
    error instanceof estudioService.SolicitudEstudioCanceladaError ||
    error instanceof estudioService.UnidadEstudioNoValidaError
  ) {
    return res.status(409).json({
      error: error.message,
    });
  }

  console.error("Error en estudios pretransfusionales:", error);

  return res.status(500).json({
    error: "Error interno",
  });
}

// POST: registrar un estudio pretransfusional.

export async function registrar(req: Request, res: Response) {
  const id = idSolicitudEstudioSchema.safeParse(
    req.params.solicitudId,
  );

  if (!id.success) {
    return res.status(400).json({
      error: "ID de solicitud inválido",
    });
  }

  const parsed = crearEstudioPretransfusionalSchema.safeParse(
    req.body,
  );

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const resultado = await estudioService.registrar(
      id.data,
      parsed.data,
    );

    return res.status(201).json(resultado);
  } catch (error) {
    return responderError(error, res);
  }
}

// GET: consultar estudios asociados a una solicitud.

export async function listarPorSolicitud(
  req: Request,
  res: Response,
) {
  const id = idSolicitudEstudioSchema.safeParse(
    req.params.solicitudId,
  );

  if (!id.success) {
    return res.status(400).json({
      error: "ID de solicitud inválido",
    });
  }

  try {
    const resultado = await estudioService.listarPorSolicitud(
      id.data,
    );

    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(error, res);
  }
}
