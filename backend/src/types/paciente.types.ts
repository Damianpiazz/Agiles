import { z } from "zod";

const obligatorio = z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio");

export const crearPacienteSchema = z.object({
  nombre: obligatorio,
  apellido: obligatorio,
  dni: z
    .string({ error: "Obligatorio" })
    .trim()
    .regex(/^\d{7,8}$/, "DNI inválido (7 u 8 dígitos)"),
  fechaNacimiento: z.coerce
    .date({ error: "Fecha inválida" })
    .refine((fecha) => fecha <= new Date(), "No puede ser futura"),
  operador: z
    .string({ error: "El operador es obligatorio" })
    .trim()
    .min(1, "El operador es obligatorio")
    .max(120, "El operador no puede superar los 120 caracteres"),
});

export type CrearPacienteInput = z.infer<typeof crearPacienteSchema>;

export const buscarPacienteSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, "DNI inválido (7 u 8 dígitos)")
    .optional(),
  nombre: z.string().trim().min(1, "Nombre inválido").optional(),
  apellido: z.string().trim().min(1, "Apellido inválido").optional(),
});

export type BuscarPacienteInput = z.infer<typeof buscarPacienteSchema>;
