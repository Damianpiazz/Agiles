import { z } from "zod";

export const resultadoPciSchema = z.object({
  antigenoId: z.coerce
    .number({ error: "Antígeno inválido" })
    .int("Antígeno inválido")
    .positive("Antígeno inválido"),
  resultado: z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio"),
  intensidad: z.string().trim().optional(),
  observacion: z.string().trim().optional(),
});

export const crearPciSchema = z.object({
  fecha: z.coerce.date({ error: "Fecha inválida" }),
  hora: z
    .string({ error: "Hora inválida (HH:MM)" })
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  observaciones: z.string().trim().optional(),
  donacionIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Seleccioná al menos una donación"),
  resultados: z.array(resultadoPciSchema).min(1, "Cargá al menos un resultado"),
});

export type CrearPciInput = z.infer<typeof crearPciSchema>;

export const idPciSchema = z.coerce
  .number()
  .int("ID inválido")
  .positive("ID inválido");

export const filtroPciSchema = z.object({
  donacionId: z.coerce.number().int().positive().optional(),
});

export type FiltroPciInput = z.infer<typeof filtroPciSchema>;
