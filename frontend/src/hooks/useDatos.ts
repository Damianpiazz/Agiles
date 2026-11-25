import { useCallback, useEffect, useState } from "react";
import type { Donante } from "../types/donante";
import type { DonacionResumen } from "../types/donacion";
import type {
  EmisionGlobal,
  EstudioGlobal,
  HistoriaPersona,
  PacienteListado,
  UnidadInventario,
} from "../types/datosGlobales";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

type DatosState<T> = {
  datos: T[];
  cargando: boolean;
  error: string;
  recargar: () => Promise<void>;
};

function useListado<T>(ruta: string, etiqueta: string): DatosState<T> {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await fetch(`${API_URL}${ruta}`);
      const contenido = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !Array.isArray(contenido)) {
        throw new Error(
          (contenido as { error?: string } | null)?.error ??
            `No se pudieron cargar ${etiqueta}.`,
        );
      }
      setDatos(contenido as T[]);
    } catch (e) {
      setDatos([]);
      setError(
        e instanceof Error ? e.message : "No se pudo conectar con el servidor.",
      );
    } finally {
      setCargando(false);
    }
  }, [ruta, etiqueta]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar };
}

export function useDonantesActivos() {
  return useListado<Donante>("/api/donantes/listado", "los donantes");
}

export function useDonaciones() {
  return useListado<DonacionResumen>("/api/donaciones", "las donaciones");
}

export function usePacientesListado() {
  return useListado<PacienteListado>("/api/pacientes/listado", "los pacientes");
}

export function useInventarioUnidades() {
  return useListado<UnidadInventario>(
    "/api/inventario-unidades",
    "las unidades de inventario",
  );
}

export function useEstudiosGlobales() {
  return useListado<EstudioGlobal>(
    "/api/estudios-pretransfusionales",
    "los estudios pretransfusionales",
  );
}

export function useEmisionesGlobales() {
  return useListado<EmisionGlobal>("/api/emisiones", "las emisiones");
}

type HistoriaState = {
  historia: HistoriaPersona | null;
  cargando: boolean;
  error: string;
  consultar: (dni: string) => Promise<void>;
};

/** Consulta real de la historia integral de una persona por DNI. */
export function useHistoriaPersona(dniInicial: string): HistoriaState {
  const [historia, setHistoria] = useState<HistoriaPersona | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const consultar = useCallback(async (dni: string) => {
    const valor = dni.trim();
    if (!/^\d{7,8}$/.test(valor)) {
      setHistoria(null);
      setError("Ingresá un DNI válido de 7 u 8 dígitos.");
      return;
    }

    setCargando(true);
    setError("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/personas/${encodeURIComponent(valor)}/historial`,
      );
      const contenido = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !contenido || typeof contenido !== "object") {
        throw new Error(
          (contenido as { error?: string } | null)?.error ??
            "No se pudo consultar la historia de la persona.",
        );
      }
      setHistoria(contenido as HistoriaPersona);
    } catch (e) {
      setHistoria(null);
      setError(
        e instanceof Error ? e.message : "No se pudo conectar con el servidor.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!dniInicial.trim()) {
      setHistoria(null);
      setError("");
      return;
    }
    void consultar(dniInicial);
  }, [dniInicial, consultar]);

  return { historia, cargando, error, consultar };
}
