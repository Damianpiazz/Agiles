import { z } from "zod";
import { pciResultadoSchema } from "../pci/pci.schema";
import { pcdResultadoSchema } from "../pcd/pcd.schema";
import { nullableDate, nullableNumber, optionalText, timeSchema } from "../../validators/common";

export const createRnSchema = z.object({
  numero: optionalText(50),
  fecha: nullableDate(),
  rn: optionalText(150),
  dni: optionalText(20),
  idMadre: nullableNumber(),
  idGrupoFactor: nullableNumber(),
  ipAntiD: optionalText(50),
  idPcd: nullableNumber(),
  idPci: nullableNumber(),
  operador: optionalText(100),
  observaciones: optionalText(1000),
});

export const updateRnSchema = createRnSchema.partial();

const estudioPciSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(pciResultadoSchema).optional().default([]),
});

const estudioPcdSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(pcdResultadoSchema).optional().default([]),
});

export const rnCompletoSchema = z.object({
  estudio: createRnSchema,
  pci: estudioPciSchema.optional(),
  pcd: estudioPcdSchema.optional(),
});

export type RnCompletoInput = z.infer<typeof rnCompletoSchema>;
