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

export const buscarDonanteSchema = z
  .object({
    dni: z
      .string()
      .trim()
      .regex(/^\d{7,8}$/, "DNI inválido (7 u 8 dígitos)")
      .optional(),

    nombre: z.string().trim().min(1, "Nombre inválido").optional(),

    apellido: z.string().trim().min(1, "Apellido inválido").optional(),
  })
  .refine(
    (data) =>
      Boolean(data.dni) ||
      (Boolean(data.nombre) && Boolean(data.apellido)),
    {
      message: "Debe ingresar DNI o nombre y apellido",
    },
  );

export type BuscarDonanteInput = z.infer<typeof buscarDonanteSchema>;

export const idDonanteSchema = z.coerce
  .number()
  .int("ID inválido")
  .positive("ID inválido");