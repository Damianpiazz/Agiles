import type { Request, Response } from "express";
import { z } from "zod";
import * as calificacionService from "../services/calificacionBiologica.service";

const iniciarSchema = z.object({
donacionId: z.number().int().positive(),
operador: z.string().trim().min(1).max(120),
});

export async function iniciar(req: Request, res: Response) {
const parsed = iniciarSchema.safeParse(req.body);

if (!parsed.success) {
return res.status(400).json({
error: "Datos inválidos",
campos: z.flattenError(parsed.error).fieldErrors,
});
}

try {
const resultado = await calificacionService.iniciar(
parsed.data.donacionId,
parsed.data.operador,
);

return res.status(resultado.creada ? 201 : 200).json(resultado);

} catch (error) {
if (error instanceof calificacionService.DonacionNoEncontradaError) {
return res.status(404).json({ error: error.message });
}

if (error instanceof calificacionService.DonacionBloqueadaError) {
return res.status(409).json({ error: error.message });
}

console.error("Error al iniciar la calificación biológica:", error);
return res.status(500).json({ error: "Error interno" });

}
}