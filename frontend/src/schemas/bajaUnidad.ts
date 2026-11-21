import { z } from "zod";

export const motivosBajaUnidad = [
  "VENCIDA",
  "TRANSFUNDIDA",
  "DESCARTADA",
] as const;

export const bajaUnidadSchema = z.object({
  unidadId: z.coerce
    .number({ error: "Seleccioná una unidad" })
    .int()
    .positive("Seleccioná una unidad"),
  motivo: z.enum(motivosBajaUnidad, {
    error: "Seleccioná un motivo de baja",
  }),
  operador: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(120, "No puede superar los 120 caracteres"),
});

export type BajaUnidadForm = z.infer<typeof bajaUnidadSchema>;
