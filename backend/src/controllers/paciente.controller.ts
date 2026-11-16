import type { Request, Response } from "express";
import { z } from "zod";
import * as pacienteService from "../services/paciente.service";
import {
  buscarPacienteSchema,
  crearPacienteSchema,
} from "../types/paciente.types";

export async function create(req: Request, res: Response) {
  const parsed = crearPacienteSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const paciente = await pacienteService.create(parsed.data);
    return res.status(201).json(paciente);
  } catch (error) {
    if (error instanceof pacienteService.PacienteDuplicadoError) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error al registrar el paciente:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function search(req: Request, res: Response) {
  const parsed = buscarPacienteSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Criterios de búsqueda inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const pacientes = await pacienteService.buscar(parsed.data);
    return res.status(200).json(pacientes);
  } catch (error) {
    console.error("Error al consultar pacientes:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
