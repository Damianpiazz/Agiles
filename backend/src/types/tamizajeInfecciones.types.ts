import { z } from "zod";

export const resultadoTamizajeSchema = z.object({
  determinacionSerologicaId: z.coerce
    .number({ error: "Determinación inválida" })
    .int("Determinación inválida")
    .positive("Determinación inválida"),
  resultado: z.enum(["REACTIVO", "NO_REACTIVO"], {
    error: "Seleccioná reactivo o no reactivo",
  }),
});

export const crearTamizajeInfeccionesSchema = z
  .object({
    donacionId: z.coerce
      .number({ error: "La donación es obligatoria" })
      .int("La donación es inválida")
      .positive("La donación es inválida"),
    fecha: z.coerce.date({ error: "La fecha de determinación es inválida" }),
    operador: z
      .string({ error: "El operador es obligatorio" })
      .trim()
      .min(1, "El operador es obligatorio")
      .max(120, "El operador no puede superar los 120 caracteres"),
    resultados: z
      .array(resultadoTamizajeSchema)
      .length(7, "Cargá el resultado de las siete pruebas de tamizaje"),
  })
  .superRefine((data, ctx) => {
    const ids = data.resultados.map((resultado) => resultado.determinacionSerologicaId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["resultados"],
        message: "No repitas determinaciones serológicas",
      });
    }
  });

export const idTamizajeInfeccionesSchema = z.coerce
  .number()
  .int("ID de donación inválido")
  .positive("ID de donación inválido");

export type CrearTamizajeInfeccionesInput = z.infer<
  typeof crearTamizajeInfeccionesSchema
>;
