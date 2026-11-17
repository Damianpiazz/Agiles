import { z } from "zod";
import { pciResultadoSchema } from "../pci/pci.schema";
import { createPersonaSchema } from "../personas/personas.schema";
import { nullableDate, nullableNumber, optionalText, timeSchema } from "../../validators/common";

export const createGestanteSchema = z.object({
  numero: optionalText(50),
  fecha: nullableDate(),
  operador: optionalText(100),
  idPersona: z.coerce.number().int().positive("La persona es obligatoria"),
});

export const updateGestanteSchema = createGestanteSchema.partial();

export const createGestantePciSchema = z.object({
  idPci: z.coerce.number().int().positive("El PCI es obligatorio"),
  idEstudiosInmunohematologicosGestante: z.coerce
    .number()
    .int()
    .positive("El estudio de gestante es obligatorio"),
});
export const updateGestantePciSchema = createGestantePciSchema.partial();

export const estudioPciSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(pciResultadoSchema).optional().default([]),
});

export const gestanteCompletaSchema = z
  .object({
    idPersona: nullableNumber(),
    persona: createPersonaSchema.optional(),
    estudio: z.object({
      numero: optionalText(50),
      fecha: nullableDate(),
      operador: optionalText(100),
    }),
    pci: estudioPciSchema.optional(),
    compatibilidadConyugal: estudioPciSchema.optional(),
  })
  .refine((value) => value.idPersona !== undefined || value.persona !== undefined, {
    message: "Indicá idPersona o los datos de la persona",
  });

export type GestanteCompletaInput = z.infer<typeof gestanteCompletaSchema>;
