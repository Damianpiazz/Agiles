import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Envuelve las respuestas exitosas en `{ data }` o `{ data, meta }`.
 */
export function sendData<T>(res: Response, data: T, status = 200, meta?: unknown): void {
  const body = meta === undefined ? { data } : { data, meta };
  res.status(status).json(body);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendData(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
