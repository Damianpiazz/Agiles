import { z } from "zod";

export const idDonacionUnidadSchema = z.coerce
  .number()
  .int("El ID de la donación debe ser entero")
  .positive("El ID de la donación debe ser positivo");

export const cambiarEstadoUnidadSchema = z
  .object({
    accion: z.enum(["LIBERAR", "BLOQUEAR"]),

    usuario: z
      .string()
      .trim()
      .min(1, "El usuario es obligatorio")
      .max(120),

    motivo: z
      .string()
      .trim()
      .max(500)
      .optional(),

    discrepanciaResuelta: z
      .boolean()
      .optional()
      .default(false),

    observacionDiscrepancia: z
      .string()
      .trim()
      .max(500)
      .optional(),
  })
  .superRefine((datos, ctx) => {
    if (
      datos.accion === "BLOQUEAR" &&
      !datos.motivo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["motivo"],
        message: "Debe indicar el motivo del bloqueo",
      });
    }

    if (
      datos.discrepanciaResuelta &&
      !datos.observacionDiscrepancia
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["observacionDiscrepancia"],
        message:
          "Debe documentar cómo se resolvió la discrepancia",
      });
    }
  });

export type CambiarEstadoUnidadInput = z.infer<
  typeof cambiarEstadoUnidadSchema
>;