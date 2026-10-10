import { z } from "zod";

export const serologiaResultadoSchema = z.object({
  determinacionSerologicaId: z
    .number({ error: "Seleccioná una determinación" })
    .int("Seleccioná una determinación")
    .positive("Seleccioná una determinación"),
  resultado: z.string().trim().min(1, "Resultado obligatorio"),
  valor: z.string().trim().optional(),
  unidad: z.string().trim().optional(),
  observacion: z.string().trim().optional(),
});

export const serologiaFormSchema = z.object({
  fecha: z.string().trim().min(1, "Fecha obligatoria"),
  hora: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  observaciones: z.string().trim().optional(),
  resultados: z
    .array(serologiaResultadoSchema)
    .min(1, "Cargá al menos un resultado"),
});

export type SerologiaForm = z.infer<typeof serologiaFormSchema>;
export type SerologiaResultadoForm = z.infer<typeof serologiaResultadoSchema>;
