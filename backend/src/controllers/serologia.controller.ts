import type { Request, Response } from "express";
import { z } from "zod";
import * as serologiaService from "../services/serologia.service";
import {
  crearSerologiaSchema,
  idSerologiaSchema,
  filtroSerologiaSchema,
} from "../types/serologia.types";
import { formatearFecha, formatearHora } from "../utils/formato";

type SerologiaRegistro = {
  id: number;
  fecha: Date;
  hora: Date;
  observaciones: string | null;
  resultados: unknown[];
  donaciones: unknown[];
};

function mapearSerologia(serologia: unknown): unknown {
  const s = serologia as SerologiaRegistro;
  return {
    ...s,
    fecha: formatearFecha(s.fecha),
    hora: formatearHora(s.hora),
  };
}

export async function create(req: Request, res: Response) {
  const parsed = crearSerologiaSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const serologia = await serologiaService.create(parsed.data);
    return res.status(201).json(mapearSerologia(serologia));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function getById(req: Request, res: Response) {
  const parsed = idSerologiaSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de serología inválido" });
  }

  try {
    const serologia = await serologiaService.buscarPorId(parsed.data);

    if (!serologia) {
      return res.status(404).json({ error: "Serología no encontrada" });
    }

    return res.status(200).json(mapearSerologia(serologia));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function list(req: Request, res: Response) {
  const parsed = filtroSerologiaSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Filtro inválido" });
  }

  try {
    const serologias = await serologiaService.listar(parsed.data);
    return res.status(200).json((serologias as unknown[]).map(mapearSerologia));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
