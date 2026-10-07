import { z } from "zod";

const obligatorio = z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio");

export const crearDonanteSchema = z.object({
  nombre: obligatorio,
  apellido: obligatorio,
  dni: z.string({ error: "Obligatorio" }).trim().regex(/^\d{7,8}$/, "DNI inválido (7 u 8 dígitos)"),
  fechaNacimiento: z.coerce
    .date({ error: "Fecha inválida" })
    .refine((d) => d <= new Date(), "No puede ser futura"),
  lugarNacimiento: obligatorio,
  sexoBiologico: z.enum(["MASCULINO", "FEMENINO"], { error: "Obligatorio" }),
  domicilio: obligatorio,
  codigoPostal: obligatorio,
  email: z.email({ error: "Email inválido" }),
  telefonoFijo: z.string().trim().optional(),
  telefonoCelular: obligatorio,
});

export type CrearDonanteInput = z.infer<typeof crearDonanteSchema>;