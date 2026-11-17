import { z } from "zod";
import { SexoBiologico } from "../../../generated/prisma/enums";
import {
  documentoSchema,
  nullableDate,
  nullableNumber,
  optionalDocumento,
  optionalText,
} from "../../validators/common";

const sexos = Object.values(SexoBiologico) as [SexoBiologico, ...SexoBiologico[]];

export const personaBaseSchema = z.object({
  dni: optionalDocumento,
  historiaClinica: optionalText(50),
  nombre: optionalText(100),
  apellido: optionalText(100),
  telefono: optionalText(50),
  fechaNacimiento: nullableDate(),
  lugarNacimiento: optionalText(150),
  sexoBiologico: z.enum(sexos).optional(),
  idDireccion: nullableNumber(),
  idGrupoFactor: nullableNumber(),
});

export const createPersonaSchema = personaBaseSchema.extend({
  dni: documentoSchema,
});

export const updatePersonaSchema = personaBaseSchema.partial();

export const grupoFactorSchema = z
  .object({
    idGrupoFactor: nullableNumber(),
    grupo: optionalText(10),
    factor: optionalText(10),
  })
  .refine(
    (value) => value.idGrupoFactor !== undefined || value.grupo !== undefined || value.factor !== undefined,
    { message: "Indicá un idGrupoFactor o los valores de grupo y factor" },
  );

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>;
export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>;
export type GrupoFactorInput = z.infer<typeof grupoFactorSchema>;
