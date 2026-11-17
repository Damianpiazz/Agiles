import { tokenStorage } from "@/infrastructure/storage/token.storage";
import type { ApiEnvelope, QueryParams } from "@/shared/types/api";
import { ApiError, notificarSesionCaducada } from "./errors";

export const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: QueryParams;
  auth?: boolean;
}

export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, auth = true, headers, ...rest } = options;
  const token = tokenStorage.get();
  const resolvedHeaders = new Headers(headers);

  if (body !== undefined) resolvedHeaders.set("Content-Type", "application/json");
  if (auth && token) resolvedHeaders.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      ...rest,
      headers: resolvedHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "SIN_CONEXION", "No hay conexión con el servidor. Revisá la red y reintentá.");
  }

  if (response.status === 204) return undefined as T;

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorBody = payload as { error?: { code?: string; message?: string; details?: unknown } } | null;
    const status = response.status;
    const code = errorBody?.error?.code ?? "ERROR";
    const message = errorBody?.error?.message ?? `Error ${status} en la solicitud`;
    if (status === 401) {
      tokenStorage.clear();
      notificarSesionCaducada();
    }
    throw new ApiError(status, code, message, errorBody?.error?.details);
  }

  const envelope = payload as ApiEnvelope<T>;
  return envelope.data;
}

export async function apiRequestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const { body, params, auth = true, headers, ...rest } = options;
  const token = tokenStorage.get();
  const resolvedHeaders = new Headers(headers);

  if (body !== undefined) resolvedHeaders.set("Content-Type", "application/json");
  if (auth && token) resolvedHeaders.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      ...rest,
      headers: resolvedHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "SIN_CONEXION", "No hay conexión con el servidor. Revisá la red y reintentá.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorBody = payload as { error?: { code?: string; message?: string; details?: unknown } } | null;
    const status = response.status;
    const code = errorBody?.error?.code ?? "ERROR";
    const message = errorBody?.error?.message ?? `Error ${status} en la solicitud`;
    if (status === 401) {
      tokenStorage.clear();
      notificarSesionCaducada();
    }
    throw new ApiError(status, code, message, errorBody?.error?.details);
  }

  return (payload ?? {}) as ApiEnvelope<T>;
}

/** Descarga un archivo (por ejemplo un CSV de reportes) respetando la sesión. */
export async function apiDownload(nombre: string, path: string, params?: QueryParams): Promise<void> {
  const token = tokenStorage.get();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const respuesta = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, { headers });
  if (!respuesta.ok) {
    let mensaje = `No se pudo descargar ${nombre}`;
    try {
      const cuerpo = (await respuesta.json()) as { error?: { message?: string } };
      mensaje = cuerpo.error?.message ?? mensaje;
    } catch {
      // El servidor devolvió un cuerpo no JSON.
    }
    throw new Error(mensaje);
  }

  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string, params?: QueryParams, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET", params }),
  getEnvelope: <T>(path: string, params?: QueryParams, options?: RequestOptions) =>
    apiRequestEnvelope<T>(path, { ...options, method: "GET", params }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
