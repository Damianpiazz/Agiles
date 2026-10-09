import { z } from "zod";

export const donacionSchema = z.object({
  donanteId: z
    .number({ error: "Seleccioná un donante" })
    .int("Seleccioná un donante")
    .positive("Seleccioná un donante"),
  operador: z.string().trim().min(1, "Campo obligatorio"),
  peso: z.string().trim().optional(),
  tensionArterial: z.string().trim().optional(),
  hemoglobina: z.string().trim().optional(),
  voluntario: z.boolean({ error: "Valor inválido" }).default(false),
  reposicion: z.boolean({ error: "Valor inválido" }).default(false),
  autoExcluido: z.boolean({ error: "Valor inválido" }).default(false),
  fechaHora: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});

export type DonacionForm = z.infer<typeof donacionSchema>;
