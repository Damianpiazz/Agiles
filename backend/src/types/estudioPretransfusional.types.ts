
import { z } from "zod";

export const idSolicitudEstudioSchema = z.coerce
  .number()
  .int("El ID debe ser un número entero")
  .positive("El ID debe ser positivo");

export const crearEstudioPretransfusionalSchema = z
  .object({
    tipo: z.enum([
      "TIPIFICACION_ABO_RHD",
      "DETECCION_ANTICUERPOS",
      "PRUEBA_CRUZADA",
    ]),

    resultado: z
      .string()
      .trim()
      .min(1, "El resultado es obligatorio")
      .max(200),

    unidadSangreId: z
      .number()
      .int()
      .positive()
      .optional(),

    compatibilidad: z
      .enum(["COMPATIBLE", "INCOMPATIBLE"])
      .optional(),

    observaciones: z
      .string()
      .trim()
      .max(500)
      .optional(),

    operador: z
      .string()
      .trim()
      .min(1, "El operador es obligatorio")
      .max(120),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo === "PRUEBA_CRUZADA") {
      if (!datos.unidadSangreId) {
        ctx.addIssue({
          code: "custom",
          path: ["unidadSangreId"],
          message:
            "La prueba cruzada requiere una unidad de sangre",
        });
      }

      if (!datos.compatibilidad) {
        ctx.addIssue({
          code: "custom",
          path: ["compatibilidad"],
          message:
            "Debe indicar si la unidad es compatible o incompatible",
        });
      }
    } else if (
      datos.unidadSangreId !== undefined ||
      datos.compatibilidad !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["tipo"],
        message:
          "La unidad y la compatibilidad corresponden a una prueba cruzada",
      });
    }
  });

export type CrearEstudioPretransfusionalInput = z.infer<
  typeof crearEstudioPretransfusionalSchema
>;
