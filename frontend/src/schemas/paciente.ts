import { z } from "zod";

const obligatorio = z.string().trim().min(1, "Campo obligatorio");

export const pacienteSchema = z.object({
  nombre: obligatorio,
  apellido: obligatorio,
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, "Ingresá 7 u 8 dígitos, sin puntos ni espacios"),
  fechaNacimiento: z
    .string()
    .min(1, "Campo obligatorio")
    .refine(
      (valor) =>
        !valor ||
        (!Number.isNaN(Date.parse(valor)) && new Date(valor) <= new Date()),
      "Ingresá una fecha válida que no sea futura",
    ),
  operador: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(120, "No puede superar los 120 caracteres"),
});

export type PacienteForm = z.infer<typeof pacienteSchema>;
