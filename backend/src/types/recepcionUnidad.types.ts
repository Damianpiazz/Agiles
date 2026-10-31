import { z } from "zod";

export const tiposHemocomponente = [
  "GLOBULOS_ROJOS",
  "PLASMA",
  "PLAQUETAS",
  "CRIOPRECIPITADO",
] as const;

export const gruposSanguineosABO = ["A", "B", "AB", "O"] as const;

export const factoresRhD = ["POSITIVO", "NEGATIVO"] as const;

export const estadosRecepcionUnidad = ["DISPONIBLE"] as const;

export function obtenerFechaHoyArgentina(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);

  const anio = partes.find((p) => p.type === "year")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  const dia = partes.find((p) => p.type === "day")?.value ?? "";

  return `${anio}-${mes}-${dia}`;
}

function esFechaCalendarioValida(valor: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!match) return false;

  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

export const crearRecepcionUnidadSchema = z.object({
  numeroUnidad: z
    .string({ error: "Obligatorio" })
    .trim()
    .min(1, "Obligatorio")
    .max(50, "No puede superar los 50 caracteres")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Formato inválido (solo letras, números y guiones)",
    ),
  tipoHemocomponente: z.enum(tiposHemocomponente, {
    error: "Obligatorio",
  }),
  grupoABO: z.enum(gruposSanguineosABO, {
    error: "Obligatorio",
  }),
  factorRhD: z.enum(factoresRhD, {
    error: "Obligatorio",
  }),
  fechaVencimiento: z
    .string({ error: "Obligatorio" })
    .trim()
    .min(1, "Obligatorio")
    .refine(esFechaCalendarioValida, "Fecha inválida")
    .refine(
      (v) => v >= obtenerFechaHoyArgentina(),
      "La fecha de vencimiento no puede ser anterior a hoy",
    )
    .transform((v) => new Date(`${v}T00:00:00.000Z`)),
  estado: z
    .enum(estadosRecepcionUnidad, {
      error: "Obligatorio",
    })
    .default("DISPONIBLE"),
  operador: z
    .string({ error: "Obligatorio" })
    .trim()
    .min(1, "Obligatorio")
    .max(120, "No puede superar los 120 caracteres"),
});

export type CrearRecepcionUnidadInput = z.infer<
  typeof crearRecepcionUnidadSchema
>;
