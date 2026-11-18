import { z } from "zod";
import { createPersonaSchema } from "../personas/personas.schema";
import { pciResultadoSchema } from "../pci/pci.schema";
import { serologiaResultadoSchema } from "../serologias/serologias.schema";
import { TipoMuestraSerologia } from "../../../generated/prisma/enums";
import { nullableNumber, optionalDocumento, optionalText, timeSchema } from "../../validators/common";

const tiposMuestra = Object.values(TipoMuestraSerologia) as [TipoMuestraSerologia, ...TipoMuestraSerologia[]];

export const donacionBaseSchema = z.object({
  peso: nullableNumber(),
  tensionArterial: optionalText(20),
  hemoglobina: nullableNumber(),
  fecha: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.date().optional(),
  ),
  voluntario: z.boolean().optional(),
  reposicion: z.boolean().optional(),
  autoexcluido: z.boolean().optional(),
  dniReceptorReposicion: optionalDocumento,
  observaciones: optionalText(1000),
  operador: optionalText(100),
  idPersona: nullableNumber(),
});

/** Una donación para reposición debe indicar el DNI del paciente receptor. */
function validarDniReceptor(donacion: { reposicion?: boolean | null; dniReceptorReposicion?: string | null }) {
  return !donacion.reposicion || Boolean(donacion.dniReceptorReposicion);
}

const MENSAJE_DNI_RECEPTOR = "Indicá el DNI del paciente receptor cuando la donación es para reposición";

export const createDonacionSchema = donacionBaseSchema
  .extend({
    persona: createPersonaSchema.optional(),
    idGrupoFactor: nullableNumber(),
  })
  .refine(validarDniReceptor, {
    message: MENSAJE_DNI_RECEPTOR,
    path: ["dniReceptorReposicion"],
  });

export const updateDonacionSchema = donacionBaseSchema.partial();

export const serologiaEstudioSchema = z.object({
  tipoMuestra: z.enum(tiposMuestra),
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(serologiaResultadoSchema).optional().default([]),
});

export const pciEstudioSchema = z.object({
  fecha: z.coerce.date(),
  hora: timeSchema,
  operador: optionalText(100),
  observaciones: optionalText(1000),
  resultados: z.array(pciResultadoSchema).optional().default([]),
});

export const guardarEstudiosSchema = z
  .object({
    serologias: z.array(serologiaEstudioSchema).optional(),
    pci: pciEstudioSchema.optional(),
  })
  .refine((value) => value.serologias?.length || value.pci, {
    message: "Enviá al menos una serología o un PCI",
  });

export const donacionCompletaSchema = z
  .object({
    idPersona: nullableNumber(),
    persona: createPersonaSchema.optional(),
    idGrupoFactor: nullableNumber(),
    donacion: donacionBaseSchema.omit({ idPersona: true }),
    serologias: z.array(serologiaEstudioSchema).optional(),
    pci: pciEstudioSchema.optional(),
  })
  .refine((value) => value.idPersona !== undefined || value.persona !== undefined, {
    message: "Indicá idPersona o los datos de la persona",
  })
  .refine((value) => validarDniReceptor(value.donacion), {
    message: MENSAJE_DNI_RECEPTOR,
    path: ["donacion", "dniReceptorReposicion"],
  });

export type CreateDonacionInput = z.infer<typeof createDonacionSchema>;
export type UpdateDonacionInput = z.infer<typeof updateDonacionSchema>;
export type GuardarEstudiosInput = z.infer<typeof guardarEstudiosSchema>;
export type DonacionCompletaInput = z.infer<typeof donacionCompletaSchema>;
export type SerologiaEstudioInput = z.infer<typeof serologiaEstudioSchema>;
export type PciEstudioInput = z.infer<typeof pciEstudioSchema>;
