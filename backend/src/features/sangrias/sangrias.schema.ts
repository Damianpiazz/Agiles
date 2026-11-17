import { z } from "zod";
import { createPersonaSchema } from "../personas/personas.schema";
import { nullableDate, nullableNumber, optionalText } from "../../validators/common";

export const sangriaBaseSchema = z.object({
  diagnostico: optionalText(300),
  extraccion: optionalText(100),
  reposicion: optionalText(150),
  fecha: nullableDate(),
  tecnico: optionalText(100),
  idPersona: nullableNumber(),
  idObraSocial: nullableNumber(),
  idMedico: nullableNumber(),
});

export const createSangriaSchema = sangriaBaseSchema.extend({
  persona: createPersonaSchema.optional(),
});

export const updateSangriaSchema = sangriaBaseSchema.partial();

export type CreateSangriaInput = z.infer<typeof createSangriaSchema>;
export type UpdateSangriaInput = z.infer<typeof updateSangriaSchema>;
