
import { z } from "zod";

export const crearTipificacionSanguineaSchema = z.object({
  donacionId: z.coerce
    .number({ error: "La donación es obligatoria" })
    .int("El ID de la donación debe ser un número entero")
    .positive("El ID de la donación debe ser positivo"),

  grupoABO: z.enum(["A", "B", "AB", "O"], {
    error: "El grupo sanguíneo debe ser A, B, AB u O",
  }),

  factorRhD: z.enum(["POSITIVO", "NEGATIVO"], {
    error: "El factor RhD debe ser POSITIVO o NEGATIVO",
  }),

  operador: z
    .string({ error: "El operador es obligatorio" })
    .trim()
    .min(1, "El operador es obligatorio")
    .max(120, "El operador no puede superar los 120 caracteres"),
});

export const idTipificacionSanguineaSchema = z.coerce
  .number()
  .int()
  .positive();

export type CrearTipificacionSanguineaInput = z.infer<
  typeof crearTipificacionSanguineaSchema
>;
