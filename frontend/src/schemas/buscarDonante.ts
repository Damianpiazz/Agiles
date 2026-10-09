import { z } from "zod";

export const buscarDonanteSchema = z
  .object({
    dni: z
      .string()
      .trim()
      .refine(
        (valor) => valor === "" || /^\d{7,8}$/.test(valor),
        "Ingresá 7 u 8 dígitos, sin puntos ni espacios",
      ),

    nombre: z.string().trim(),

    apellido: z.string().trim(),
  })
  .refine(
    (datos) =>
      Boolean(datos.dni) ||
      (Boolean(datos.nombre) && Boolean(datos.apellido)),
    {
      message: "Ingresá un DNI o nombre y apellido",
    },
  );

export type BuscarDonanteForm = z.infer<typeof buscarDonanteSchema>;