import type { Request, Response } from "express";
import { z } from "zod";
import * as donanteService from "../services/donante.service";
import {
  crearDonanteSchema,
  buscarDonanteSchema,
  idDonanteSchema,
} from "../types/donante.types";
import { setTraceSigInt } from "node:util";

export async function create(req: Request, res: Response) {
  const parsed = crearDonanteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }
  try {
    const donante = await donanteService.create(parsed.data);
    return res.status(201).json(donante);
  } catch (e) {
    if (e instanceof donanteService.DonanteDuplicadoError) {
      return res.status(409).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function search(req: Request, res: Response) {
  const parsed = buscarDonanteSchema.safeParse(req.query);

  if (!parsed.success) {
    const errores = z.flattenError(parsed.error);

    return res.status(400).json({
      error: "Criterios de búsqueda inválidos",
      campos: errores.fieldErrors,
      detalle: errores.formErrors,
    });
  }

  try {
    const donantes = await donanteService.buscar(parsed.data);

    return res.status(200).json(donantes);
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      error: "Error interno",
    });
  }
}

export async function getById(req: Request, res: Response) {
  const parsed = idDonanteSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({
      error: "ID de donante inválido",
    });
  }

  try {
    const donante = await donanteService.buscarPorId(parsed.data);

    if (!donante) {
      return res.status(404).json({
        error: "Donante no encontrado",
      });
    }

    return res.status(200).json(donante);
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      error: "Error interno",
    });
  }
}