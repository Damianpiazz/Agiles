import { z } from "zod";
import { nullableNumber, optionalText, timeSchema } from "../../validators/common";

export const pcdResultadoSchema = z.object({
  idDeterminacionPcd: nullableNumber(),
  resultado: optionalText(100),
  valor: optionalText(100),
  unidad: optionalText(50),
  observacion: optionalText(500),
});

export const createPcdSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(pcdResultadoSchema).optional().default([]),
});

export const updatePcdSchema = createPcdSchema.partial();

export const createPcdResultadoSchema = pcdResultadoSchema.extend({
  idPcd: z.coerce.number().int().positive("El PCD es obligatorio"),
});
export const updatePcdResultadoSchema = pcdResultadoSchema.partial();

export type PcdResultadoInput = z.infer<typeof pcdResultadoSchema>;
