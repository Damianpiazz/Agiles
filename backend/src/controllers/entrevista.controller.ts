import type { Request, Response } from "express";
import { z } from "zod";
import * as entrevistaService from "../services/entrevista.service";
import { crearEntrevistaSchema } from "../types/entrevista.types";
import { idDonanteSchema } from "../types/donante.types";

export async function create(req: Request, res: Response) {
  const idParsed = idDonanteSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return res.status(400).json({ error: "ID de donante inválido" });
  }

  const parsed = crearEntrevistaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const entrevista = await entrevistaService.create(idParsed.data, parsed.data);
    return res.status(201).json(entrevista);
  } catch (e) {
    if (e instanceof entrevistaService.DonanteNoEncontradoError) {
      return res.status(404).json({ error: e.message });
    }
    if (e instanceof entrevistaService.CuestionarioInvalidoError) {
      return res.status(400).json({ error: e.message });
    }
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
