import { z } from "zod";

const obligatorio = z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio");

export const crearDonacionSchema = z.object({
  donanteId: z.coerce
    .number({ error: "Obligatorio" })
    .int("Donante inválido")
    .positive("Donante inválido"),
  operador: obligatorio,
  observaciones: z.string().trim().optional(),
});

export type CrearDonacionInput = z.infer<typeof crearDonacionSchema>;

export const idDonacionSchema = z.coerce
  .number()
  .int("ID inválido")
  .positive("ID inválido");
