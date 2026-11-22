import type { Request, Response } from "express";
import { z } from "zod";
import * as solicitudService from "../services/solicitudTransfusion.service";
import {
  actualizarSolicitudTransfusionSchema,
  cancelarSolicitudTransfusionSchema,
  crearSolicitudTransfusionSchema,
  idSolicitudTransfusionSchema,
  listarSolicitudesTransfusionSchema,
} from "../types/solicitudTransfusion.types";

function responderError(error: unknown, res: Response) {
  if (error instanceof solicitudService.PacienteSolicitudNoEncontradoError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof solicitudService.SolicitudTransfusionNoEncontradaError) {
    return res.status(404).json({ error: error.message });
  }
  if (
    error instanceof solicitudService.SolicitudTransfusionCanceladaError ||
    error instanceof solicitudService.SolicitudTransfusionConUnidadesError
  ) {
    return res.status(409).json({ error: error.message });
  }
  if (error instanceof solicitudService.SolicitudTransfusionSinCambiosError) {
    return res.status(400).json({ error: error.message });
  }

  console.error("Error en solicitud de transfusión:", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function listar(req: Request, res: Response) {
  const parsed = listarSolicitudesTransfusionSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Filtro inválido",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    return res.status(200).json(await solicitudService.listar(parsed.data));
  } catch (error) {
    return responderError(error, res);
  }
}

export async function crear(req: Request, res: Response) {
  const parsed = crearSolicitudTransfusionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    return res.status(201).json(await solicitudService.crear(parsed.data));
  } catch (error) {
    return responderError(error, res);
  }
}

export async function buscarPorId(req: Request, res: Response) {
  const parsed = idSolicitudTransfusionSchema.safeParse(req.params.solicitudId);
  if (!parsed.success) {
    return res.status(400).json({ error: "ID de solicitud inválido" });
  }

  try {
    const solicitud = await solicitudService.buscarPorId(parsed.data);
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
    return res.status(200).json(solicitud);
  } catch (error) {
    return responderError(error, res);
  }
}

export async function actualizar(req: Request, res: Response) {
  const id = idSolicitudTransfusionSchema.safeParse(req.params.solicitudId);
  const parsed = actualizarSolicitudTransfusionSchema.safeParse(req.body);
  if (!id.success || !parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    return res.status(200).json(await solicitudService.actualizar(id.data, parsed.data));
  } catch (error) {
    return responderError(error, res);
  }
}

export async function cancelar(req: Request, res: Response) {
  const id = idSolicitudTransfusionSchema.safeParse(req.params.solicitudId);
  const parsed = cancelarSolicitudTransfusionSchema.safeParse(req.body);
  if (!id.success || !parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    return res.status(200).json(await solicitudService.cancelar(id.data, parsed.data));
  } catch (error) {
    return responderError(error, res);
  }
}
