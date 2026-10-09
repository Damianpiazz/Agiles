import type { Request, Response } from "express";
import * as catalogoService from "../services/catalogo.service";

export async function listarAntigenos(_req: Request, res: Response) {
  try {
    return res.status(200).json(await catalogoService.listarAntigenos());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listarDeterminacionesSerologicas(
  _req: Request,
  res: Response,
) {
  try {
    return res
      .status(200)
      .json(await catalogoService.listarDeterminacionesSerologicas());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
