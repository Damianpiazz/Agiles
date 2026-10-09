import { z } from "zod";

export const donacionSchema = z.object({
  donanteId: z
    .number({ error: "Seleccioná un donante" })
    .int("Seleccioná un donante")
    .positive("Seleccioná un donante"),
  operador: z.string().trim().min(1, "Campo obligatorio"),
  observaciones: z.string().trim().optional(),
});

export type DonacionForm = z.infer<typeof donacionSchema>;
