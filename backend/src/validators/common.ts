import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Texto opcional que convierte cadenas vacías en `undefined`. */
export function optionalText(maxLength = 255) {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );
}

export function nullableText(maxLength = 2000) {
  return z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().max(maxLength).nullable().optional(),
  );
}

export function optionalNumber() {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().optional(),
  );
}

export function nullableNumber() {
  return z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.number().nullable().optional(),
  );
}

export function optionalDate() {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.date().optional(),
  );
}

export function nullableDate() {
  return z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.date().nullable().optional(),
  );
}

/** Acepta "HH:mm" o "HH:mm:ss". */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "La hora debe tener formato HH:mm o HH:mm:ss");

/** Normaliza el documento quitando puntos, espacios y guiones. */
export const documentoSchema = z
  .string()
  .trim()
  .min(1, "El DNI es obligatorio")
  .transform((value) => value.replace(/[.\s-]/g, ""))
  .refine((value) => /^\d{5,12}$/.test(value), "El DNI debe contener entre 5 y 12 dígitos");

export const optionalDocumento = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  documentoSchema.optional(),
);

export const fechaNacimientoSchema = optionalDate();

/** Envuelve un esquema para permitir actualizaciones parciales. */
export function partialOf<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.partial();
}
