import type { Request } from "express";
import { badRequest, notFound } from "./errors";
import { paginationMeta } from "./http";
import { firstValue, parseBoolean, parsePositiveInt, parseSort } from "./query";

export type CrudFilterType = "string" | "number" | "boolean" | "date";

export interface CrudDelegate {
  findMany(args?: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown | null>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
  count(args?: unknown): Promise<number>;
}

export interface CrudOptions {
  /** Nombre lógico usado en mensajes de error. */
  label: string;
  delegate: CrudDelegate;
  /** Campos donde se aplica la búsqueda libre `q`. */
  searchFields?: string[];
  /** Filtros exactos habilitados por query string. */
  filters?: Record<string, CrudFilterType>;
  /** Campos válidos para `?sort=`. */
  sortFields?: string[];
  defaultSort?: Record<string, "asc" | "desc">;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  /** Restricción fija aplicada en listados y búsquedas. */
  defaultWhere?: Record<string, unknown>;
  transform?: (item: unknown) => unknown;
}

export interface CrudListResult {
  items: unknown[];
  meta: ReturnType<typeof paginationMeta>;
}

function coerceFilter(value: string, type: CrudFilterType, field: string): unknown {
  switch (type) {
    case "number": {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) throw badRequest(`El filtro "${field}" debe ser numérico`);
      return parsed;
    }
    case "boolean":
      return parseBoolean(value);
    case "date": {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) throw badRequest(`El filtro "${field}" debe ser una fecha válida`);
      return date;
    }
    default:
      return value;
  }
}

export function parseId(value: string | string[] | undefined, label = "registro"): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`El identificador de ${label} debe ser un número entero positivo`);
  }
  return id;
}

export function createCrudService(options: CrudOptions) {
  const {
    label,
    delegate,
    searchFields = [],
    filters = {},
    sortFields = ["id"],
    defaultSort = { id: "desc" },
    include,
    select,
    defaultWhere = {},
    transform,
  } = options;

  const projection = select ? { select } : include ? { include } : {};

  function buildWhere(query: Request["query"]): Record<string, unknown> {
    const where: Record<string, unknown> = { ...defaultWhere };

    const search = firstValue(query.q);
    if (search && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));
    }

    for (const [field, type] of Object.entries(filters)) {
      const raw = firstValue(query[field]);
      if (raw !== undefined) where[field] = coerceFilter(raw, type, field);
    }

    return where;
  }

  return {
    async list(query: Request["query"]): Promise<CrudListResult> {
      const page = parsePositiveInt(query.page, 1);
      const limit = parsePositiveInt(query.limit, 25, 500);
      const all = parseBoolean(query.all) ?? false;
      const sort = parseSort(query, sortFields, defaultSort);
      const where = buildWhere(query);

      const [total, rows] = await Promise.all([
        delegate.count({ where }),
        delegate.findMany({
          where,
          ...projection,
          orderBy: sort.orderBy,
          skip: all ? undefined : (page - 1) * limit,
          take: all ? undefined : limit,
        }),
      ]);

      const items = transform ? rows.map(transform) : rows;
      return { items, meta: paginationMeta(page, limit, total) };
    },

    async getById(id: number): Promise<unknown> {
      const row = await delegate.findUnique({ where: { id }, ...projection });
      if (!row) throw notFound(`No existe ${label} con id ${id}`);
      return transform ? transform(row) : row;
    },

    async create(data: Record<string, unknown>): Promise<unknown> {
      const row = await delegate.create({ data, ...projection });
      return transform ? transform(row) : row;
    },

    async update(id: number, data: Record<string, unknown>): Promise<unknown> {
      const row = await delegate.update({ where: { id }, data, ...projection });
      return transform ? transform(row) : row;
    },

    async remove(id: number): Promise<void> {
      await delegate.delete({ where: { id } });
    },
  };
}

export type CrudService = ReturnType<typeof createCrudService>;
