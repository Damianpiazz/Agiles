import { z } from "zod";
import { optionalText } from "../../validators/common";

const requiredName = z.string().trim().min(1, "El nombre es obligatorio").max(150);

export const createGyfSchema = z.object({
  grupo: optionalText(10),
  factor: optionalText(10),
});
export const updateGyfSchema = createGyfSchema.partial();

export const createObraSocialSchema = z.object({ nombre: optionalText(150) });
export const updateObraSocialSchema = createObraSocialSchema.partial();

export const createMedicoSchema = z.object({ nombre: optionalText(150) });
export const updateMedicoSchema = createMedicoSchema.partial();

export const createDeterminacionSerologicaSchema = z.object({ nombre: requiredName });
export const updateDeterminacionSerologicaSchema = createDeterminacionSerologicaSchema.partial();

export const createDeterminacionPcdSchema = z.object({ nombre: requiredName });
export const updateDeterminacionPcdSchema = createDeterminacionPcdSchema.partial();

export const createAntigenoSchema = z.object({ nombre: requiredName });
export const updateAntigenoSchema = createAntigenoSchema.partial();

export const createFenotipoSchema = z.object({ nombre: optionalText(50) });
export const updateFenotipoSchema = createFenotipoSchema.partial();

export const createTipoTransfusionSchema = z.object({ nombre: optionalText(100) });
export const updateTipoTransfusionSchema = createTipoTransfusionSchema.partial();
