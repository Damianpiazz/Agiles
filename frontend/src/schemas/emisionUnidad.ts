import { z } from "zod";

export const emitirUnidadFormSchema = z.object({
  responsable: z
    .string({ error: "Ingresá el responsable de la emisión" })
    .trim()
    .min(1, "Ingresá el responsable de la emisión")
    .max(120, "El responsable no puede superar los 120 caracteres"),
  observaciones: z
    .string()
    .trim()
    .max(500, "Las observaciones no pueden superar los 500 caracteres")
    .transform((valor) => (valor ? valor : undefined))
    .optional(),
});

export type EmitirUnidadFormInput = z.infer<typeof emitirUnidadFormSchema>;
