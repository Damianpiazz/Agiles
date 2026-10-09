import { z } from "zod";

export const resultadoSerologiaSchema = z.object({
  determinacionSerologicaId: z.coerce
    .number({ error: "Determinación inválida" })
    .int("Determinación inválida")
    .positive("Determinación inválida"),
  resultado: z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio"),
  valor: z.string().trim().optional(),
  unidad: z.string().trim().optional(),
  observacion: z.string().trim().optional(),
});

export const crearSerologiaSchema = z.object({
  fecha: z.coerce.date({ error: "Fecha inválida" }),
  hora: z
    .string({ error: "Hora inválida (HH:MM)" })
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  observaciones: z.string().trim().optional(),
  donacionIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Seleccioná al menos una donación"),
  resultados: z
    .array(resultadoSerologiaSchema)
    .min(1, "Cargá al menos un resultado"),
});

export type CrearSerologiaInput = z.infer<typeof crearSerologiaSchema>;

export const idSerologiaSchema = z.coerce
  .number()
  .int("ID inválido")
  .positive("ID inválido");

export const filtroSerologiaSchema = z.object({
  donacionId: z.coerce.number().int().positive().optional(),
});

export type FiltroSerologiaInput = z.infer<typeof filtroSerologiaSchema>;
