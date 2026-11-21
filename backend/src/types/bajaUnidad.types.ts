import { z } from "zod";

export const motivosBajaUnidad = [
  "VENCIDA",
  "TRANSFUNDIDA",
  "DESCARTADA",
] as const;

export const darDeBajaUnidadSchema = z.object({
  motivo: z.enum(motivosBajaUnidad, {
    error: "Obligatorio",
  }),
  operador: z
    .string({ error: "Obligatorio" })
    .trim()
    .min(1, "Obligatorio")
    .max(120, "No puede superar los 120 caracteres"),
});

export type DarDeBajaUnidadInput = z.infer<typeof darDeBajaUnidadSchema>;
