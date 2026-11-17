import { z } from "zod";
import { TipoMuestraSerologia } from "../../../generated/prisma/enums";
import { optionalText, timeSchema } from "../../validators/common";

const tiposMuestra = Object.values(TipoMuestraSerologia) as [TipoMuestraSerologia, ...TipoMuestraSerologia[]];

export const serologiaResultadoSchema = z.object({
  determinacionSerologicaId: z.coerce.number().int().positive("La determinación es obligatoria"),
  resultado: z.string().trim().min(1, "El resultado es obligatorio").max(100),
  valor: optionalText(100),
  unidad: optionalText(50),
  observacion: optionalText(500),
});

export const createSerologiaSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  tipoMuestra: z.enum(tiposMuestra).optional(),
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(serologiaResultadoSchema).optional().default([]),
});

export const updateSerologiaSchema = createSerologiaSchema.partial();

export const createSerologiaResultadoSchema = serologiaResultadoSchema.extend({
  serologiaId: z.coerce.number().int().positive("La serología es obligatoria"),
});
export const updateSerologiaResultadoSchema = serologiaResultadoSchema.partial();

export const linkDonacionSchema = z.object({
  idDonacion: z.coerce.number().int().positive("La donación es obligatoria"),
});

export type SerologiaResultadoInput = z.infer<typeof serologiaResultadoSchema>;
