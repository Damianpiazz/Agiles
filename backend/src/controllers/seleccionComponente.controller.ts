import type { Request, Response } from "express";
import { z } from "zod";
import * as seleccionComponenteService from "../services/seleccionComponente.service";
import {
  idSolicitudSchema,
  idUnidadSchema,
  listarSolicitudesQuerySchema,
  reservarUnidadSchema,
} from "../types/seleccionComponente.types";

export async function listar(req: Request, res: Response) {
  const parsed = listarSolicitudesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Filtro inválido",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const solicitudes = await seleccionComponenteService.listarSolicitudes(
      parsed.data.estado,
    );

    return res.status(200).json(solicitudes);
  } catch (error) {
    console.error("Error al consultar solicitudes de transfusión:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listarUnidadesCompatibles(req: Request, res: Response) {
  const parsed = idSolicitudSchema.safeParse(req.params.solicitudId);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de solicitud inválido" });
  }

  try {
    const resultado =
      await seleccionComponenteService.listarUnidadesCompatibles(parsed.data);

    return res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof seleccionComponenteService.SolicitudNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof seleccionComponenteService.SolicitudNoAprobadaError) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error al consultar unidades compatibles:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listarUnidadesReservadas(req: Request, res: Response) {
  const parsed = idSolicitudSchema.safeParse(req.params.solicitudId);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de solicitud inválido" });
  }

  try {
    const resultado =
      await seleccionComponenteService.listarUnidadesReservadas(parsed.data);

    return res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof seleccionComponenteService.SolicitudNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    console.error("Error al consultar unidades preparadas:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function reservarUnidad(req: Request, res: Response) {
  const solicitudId = idSolicitudSchema.safeParse(req.params.solicitudId);
  const unidadId = idUnidadSchema.safeParse(req.params.unidadId);

  if (!solicitudId.success || !unidadId.success) {
    return res.status(400).json({ error: "ID de solicitud o unidad inválido" });
  }

  const parsed = reservarUnidadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const resultado = await seleccionComponenteService.reservarUnidad(
      solicitudId.data,
      unidadId.data,
      parsed.data.operador,
    );

    return res.status(201).json(resultado);
  } catch (error) {
    if (error instanceof seleccionComponenteService.SolicitudNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof seleccionComponenteService.UnidadNoEncontradaError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof seleccionComponenteService.SolicitudNoAprobadaError) {
      return res.status(409).json({ error: error.message });
    }

    if (error instanceof seleccionComponenteService.UnidadNoDisponibleError) {
      return res.status(409).json({ error: error.message });
    }

    if (error instanceof seleccionComponenteService.UnidadNoCompatibleError) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error al preparar la unidad:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
