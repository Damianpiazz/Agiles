import { z } from "zod";

export const registrarAnticuerpoIrregularSchema = z.object({
  donacionId: z.coerce
    .number({ error: "La donación es obligatoria" })
    .int("El ID de la donación debe ser un número entero")
    .positive("El ID de la donación debe ser positivo"),

  resultado: z.enum(["POSITIVO", "NEGATIVO"], {
    error: "El resultado debe ser POSITIVO o NEGATIVO",
  }),

  operador: z
    .string({ error: "El operador es obligatorio" })
    .trim()
    .min(1, "El operador es obligatorio")
    .max(120, "El operador no puede superar los 120 caracteres"),

  observacion: z
    .string()
    .trim()
    .max(500, "La observación no puede superar los 500 caracteres")
    .optional()
    .transform((valor) => valor || undefined),
});

export const idAnticuerpoIrregularSchema = z.coerce
  .number()
  .int()
  .positive();

export type RegistrarAnticuerpoIrregularInput = z.infer<
  typeof registrarAnticuerpoIrregularSchema
>;
