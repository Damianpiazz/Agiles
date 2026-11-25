import type { Request, Response } from "express";
import * as personaHistorialService from "../services/personaHistorial.service";

export async function consultar(req: Request, res: Response) {
  const dni = String(req.params.dni ?? "").trim();

  if (!/^\d{7,8}$/.test(dni)) {
    return res.status(400).json({ error: "DNI inválido (7 u 8 dígitos)." });
  }

  try {
    return res.status(200).json(await personaHistorialService.consultar(dni));
  } catch (error) {
    if (error instanceof personaHistorialService.DniInvalidoError) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error al consultar la historia de la persona:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
