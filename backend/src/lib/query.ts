import type { ParsedQs } from "qs";
import { badRequest } from "./errors";

export type RawQuery = ParsedQs;

export function firstValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstValue(value[0]);
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return undefined;
}

export function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const raw = firstValue(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`El valor "${raw}" debe ser un número entero positivo`);
  }
  return max !== undefined ? Math.min(parsed, max) : parsed;
}

export function parseNonNegativeInt(value: unknown, fallback = 0): number {
  const raw = firstValue(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`El valor "${raw}" debe ser un número entero mayor o igual a cero`);
  }
  return parsed;
}

export function parseBoolean(value: unknown): boolean | undefined {
  const raw = firstValue(value);
  if (raw === undefined) return undefined;
  if (["true", "1", "si", "sí", "yes"].includes(raw.toLowerCase())) return true;
  if (["false", "0", "no"].includes(raw.toLowerCase())) return false;
  throw badRequest(`El valor "${raw}" debe ser booleano (true/false)`);
}

export function parseDate(value: unknown, field: string): Date | undefined {
  const raw = firstValue(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`El campo "${field}" no contiene una fecha válida`);
  }
  return date;
}

/** Convierte "HH:mm" o "HH:mm:ss" en un Date compatible con @db.Time. */
export function parseTime(value: unknown, field = "hora"): Date | undefined {
  const raw = firstValue(value);
  if (!raw) return undefined;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) {
    throw badRequest(`El campo "${field}" debe tener el formato HH:mm o HH:mm:ss`);
  }
  const [, hours, minutes, seconds = "00"] = match;
  return new Date(Date.UTC(1970, 0, 1, Number(hours), Number(minutes), Number(seconds)));
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  take: number | undefined;
  all: boolean;
}

export function parsePagination(query: RawQuery, defaultLimit = 25): Pagination {
  const all = parseBoolean(query.all) ?? false;
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, defaultLimit, 500);
  return { page, limit, skip: (page - 1) * limit, take: all ? undefined : limit, all };
}

export interface Sort {
  field: string;
  order: "asc" | "desc";
  orderBy: Record<string, "asc" | "desc">;
}

export function parseSort(
  query: RawQuery,
  allowed: string[],
  fallback: Record<string, "asc" | "desc">,
): Sort {
  const field = firstValue(query.sort);
  const order = firstValue(query.order) === "desc" ? "desc" : "asc";
  if (!field) {
    const [firstField, firstOrder] = Object.entries(fallback)[0] ?? ["id", "asc"];
    return { field: firstField, order: firstOrder as "asc" | "desc", orderBy: fallback };
  }
  if (!allowed.includes(field)) {
    throw badRequest(`No se puede ordenar por "${field}". Campos permitidos: ${allowed.join(", ")}`);
  }
  return { field, order, orderBy: { [field]: order } };
}

export interface DateRange {
  gte?: Date;
  lte?: Date;
}

export function parseDateRange(
  query: Record<string, unknown>,
  fromField = "desde",
  toField = "hasta",
): DateRange {
  const range: DateRange = {};
  const desde = parseDate(query[fromField], fromField);
  const hasta = parseDate(query[toField], toField);
  if (desde) range.gte = desde;
  if (hasta) range.lte = hasta;
  if (desde && hasta && desde > hasta) {
    throw badRequest(`La fecha "${fromField}" no puede ser posterior a "${toField}"`);
  }
  return range;
}

export function hasRange(range: DateRange): boolean {
  return Boolean(range.gte || range.lte);
}
