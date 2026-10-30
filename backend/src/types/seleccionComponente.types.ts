import { z } from "zod";

export const estadosSolicitudTransfusion = [
  "PENDIENTE",
  "APROBADA",
  "CANCELADA",
] as const;

export const listarSolicitudesQuerySchema = z.object({
  estado: z.enum(estadosSolicitudTransfusion).optional(),
});

export const idSolicitudSchema = z.coerce
  .number()
  .int("El ID de la solicitud debe ser un número entero")
  .positive();

export const idUnidadSchema = z.coerce
  .number()
  .int("El ID de la unidad debe ser un número entero")
  .positive();

export const reservarUnidadSchema = z.object({
  operador: z
    .string({ error: "El operador es obligatorio" })
    .trim()
    .min(1, "El operador es obligatorio")
    .max(120, "El operador no puede superar los 120 caracteres"),
});

export type ListarSolicitudesQuery = z.infer<
  typeof listarSolicitudesQuerySchema
>;

export type ReservarUnidadInput = z.infer<typeof reservarUnidadSchema>;
