import { z } from "zod";

export const idSolicitudEmisionSchema = z.coerce
  .number()
  .int("ID de solicitud inválido")
  .positive("ID de solicitud inválido");

export const idUnidadEmisionSchema = z.coerce
  .number()
  .int("ID de unidad inválido")
  .positive("ID de unidad inválido");

export const emitirUnidadSchema = z.object({
  responsable: z
    .string({ error: "Obligatorio" })
    .trim()
    .min(1, "Obligatorio")
    .max(120, "El responsable no puede superar los 120 caracteres"),
  observaciones: z
    .string()
    .trim()
    .max(500, "Las observaciones no pueden superar los 500 caracteres")
    .transform((valor) => (valor ? valor : undefined))
    .optional(),
});

export type EmitirUnidadInput = z.infer<typeof emitirUnidadSchema>;
