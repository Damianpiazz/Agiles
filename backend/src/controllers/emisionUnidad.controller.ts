import type { Request, Response } from "express";
import { z } from "zod";
import * as emisionService from "../services/emisionUnidad.service";
import {
  emitirUnidadSchema,
  idSolicitudEmisionSchema,
  idUnidadEmisionSchema,
} from "../types/emisionUnidad.types";

function responderError(error: unknown, res: Response) {
  if (
    error instanceof emisionService.SolicitudEmisionNoEncontradaError ||
    error instanceof emisionService.UnidadEmisionNoEncontradaError
  ) {
    return res.status(404).json({ error: error.message });
  }

  if (
    error instanceof emisionService.SolicitudNoAprobadaParaEmisionError ||
    error instanceof emisionService.SolicitudSinPacienteParaEmisionError ||
    error instanceof emisionService.UnidadNoReservadaParaEmisionError ||
    error instanceof emisionService.UnidadNoPerteneceASolicitudError ||
    error instanceof emisionService.UnidadVencidaParaEmisionError ||
    error instanceof emisionService.UnidadIncompatibleParaEmisionError ||
    error instanceof emisionService.PruebaCruzadaIncompatibleError
  ) {
    return res.status(409).json({ error: error.message });
  }

  console.error("Error en emisión de unidad:", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function emitir(req: Request, res: Response) {
  const solicitudId = idSolicitudEmisionSchema.safeParse(req.params.solicitudId);
  const unidadId = idUnidadEmisionSchema.safeParse(req.params.unidadId);
  const parsed = emitirUnidadSchema.safeParse(req.body);

  if (!solicitudId.success || !unidadId.success || !parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const resultado = await emisionService.emitir(
      solicitudId.data,
      unidadId.data,
      parsed.data,
    );
    return res.status(201).json(resultado);
  } catch (error) {
    return responderError(error, res);
  }
}

export async function listarPorUnidad(req: Request, res: Response) {
  const unidadId = idUnidadEmisionSchema.safeParse(req.params.id);
  if (!unidadId.success) {
    return res.status(400).json({ error: "ID de unidad inválido" });
  }

  try {
    return res
      .status(200)
      .json(await emisionService.listarPorUnidad(unidadId.data));
  } catch (error) {
    return responderError(error, res);
  }
}

export async function listarPorSolicitud(req: Request, res: Response) {
  const solicitudId = idSolicitudEmisionSchema.safeParse(req.params.solicitudId);
  if (!solicitudId.success) {
    return res.status(400).json({ error: "ID de solicitud inválido" });
  }

  try {
    return res
      .status(200)
      .json(await emisionService.listarPorSolicitud(solicitudId.data));
  } catch (error) {
    return responderError(error, res);
  }
}
