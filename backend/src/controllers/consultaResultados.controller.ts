
import type { Request, Response } from "express";
import {
  consultarPorDni,
  DonanteNoEncontradoError,
} from "../services/consultaResultados.service";

export async function consultarPorDniController(
  req: Request,
  res: Response,
) {
  console.log("Consultando resultados para DNI:", req.params.dni);

  try {
    const dni = String(req.params.dni).trim();

    if (!/^\d{7,8}$/.test(dni)) {
      return res.status(400).json({
        error: "El DNI debe contener 7 u 8 dígitos.",
      });
    }

    const resultado = await consultarPorDni(dni);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("ERROR COMPLETO:", error);

    if (error instanceof DonanteNoEncontradoError) {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Error interno al consultar los resultados.",
    });
  }
}
