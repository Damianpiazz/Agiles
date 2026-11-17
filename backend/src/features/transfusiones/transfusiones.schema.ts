import { z } from "zod";
import { createPersonaSchema } from "../personas/personas.schema";
import { nullableDate, nullableNumber, optionalText } from "../../validators/common";

export const transfusionBaseSchema = z.object({
  numeroOLote: optionalText(100),
  rt: optionalText(100),
  tolerancia: optionalText(100),
  pci: optionalText(200),
  pcd: optionalText(200),
  anticuerpo: optionalText(200),
  fecha: nullableDate(),
  tecnico: optionalText(100),
  idPersona: nullableNumber(),
  idFenotipo1: nullableNumber(),
  idFenotipo2: nullableNumber(),
  idGrupoFactor: nullableNumber(),
  idTipoTransfusion: nullableNumber(),
});

export const createTransfusionSchema = transfusionBaseSchema.extend({
  persona: createPersonaSchema.optional(),
});

export const updateTransfusionSchema = transfusionBaseSchema.partial();

export type CreateTransfusionInput = z.infer<typeof createTransfusionSchema>;
export type UpdateTransfusionInput = z.infer<typeof updateTransfusionSchema>;
