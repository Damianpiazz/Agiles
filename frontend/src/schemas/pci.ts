import { z } from "zod";

export const pciResultadoSchema = z.object({
  antigenoId: z
    .number({ error: "Seleccioná un antígeno" })
    .int("Seleccioná un antígeno")
    .positive("Seleccioná un antígeno"),
  resultado: z.string().trim().min(1, "Resultado obligatorio"),
  intensidad: z.string().trim().optional(),
  observacion: z.string().trim().optional(),
});

export const pciFormSchema = z.object({
  fecha: z.string().trim().min(1, "Fecha obligatoria"),
  hora: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  observaciones: z.string().trim().optional(),
  resultados: z.array(pciResultadoSchema).min(1, "Cargá al menos un resultado"),
});

export type PciForm = z.infer<typeof pciFormSchema>;
export type PciResultadoForm = z.infer<typeof pciResultadoSchema>;
