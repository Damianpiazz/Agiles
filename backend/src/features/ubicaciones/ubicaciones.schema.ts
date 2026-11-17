import { z } from "zod";
import { optionalText } from "../../validators/common";

export const createProvinciaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
});
export const updateProvinciaSchema = createProvinciaSchema.partial();

export const createCiudadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  codigoPostal: optionalText(20),
  idProvincia: z.coerce.number().int().positive("La provincia es obligatoria"),
});
export const updateCiudadSchema = createCiudadSchema.partial();

export const createDomicilioSchema = z.object({
  calle: optionalText(150),
  numero: optionalText(20),
  piso: optionalText(20),
  departamento: optionalText(20),
  idCiudad: z.coerce.number().int().positive("La ciudad es obligatoria"),
});
export const updateDomicilioSchema = createDomicilioSchema.partial();
