import { z } from "zod";
import { optionalText, timeSchema } from "../../validators/common";

export const pciResultadoSchema = z.object({
  antigenoId: z.coerce.number().int().positive("El antígeno es obligatorio"),
  resultado: z.string().trim().min(1, "El resultado es obligatorio").max(100),
  intensidad: optionalText(50),
  observacion: optionalText(500),
});

export const createPciSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(pciResultadoSchema).optional().default([]),
});

export const updatePciSchema = createPciSchema.partial();

export const createPciResultadoSchema = pciResultadoSchema.extend({
  pciId: z.coerce.number().int().positive("El PCI es obligatorio"),
});
export const updatePciResultadoSchema = pciResultadoSchema.partial();

export const linkDonacionSchema = z.object({
  idDonacion: z.coerce.number().int().positive("La donación es obligatoria"),
});

export type PciResultadoInput = z.infer<typeof pciResultadoSchema>;
