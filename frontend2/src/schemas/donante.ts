import { z } from "zod";

const obligatorio = z.string().trim().min(1, "Campo obligatorio");

export const donanteSchema = z.object({
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
      (v) => !Number.isNaN(Date.parse(v)) && new Date(v) <= new Date(),
      "Ingresá una fecha válida que no sea futura",
    ),
  lugarNacimiento: obligatorio,
  sexoBiologico: z.enum(["MASCULINO", "FEMENINO"], {
    error: "Seleccioná una opción",
  }),
  domicilio: obligatorio,
  codigoPostal: obligatorio,
  email: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .pipe(z.email("Ingresá un email válido")),
  telefonoFijo: z.string().trim().optional(),
  telefonoCelular: obligatorio,
});

export type DonanteForm = z.infer<typeof donanteSchema>;