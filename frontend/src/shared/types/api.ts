export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: unknown;
}

export interface ApiList<T> {
  data: T[];
  meta: PaginationMeta;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface Identifiable {
  id: number;
}
