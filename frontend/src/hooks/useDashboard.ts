import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { DashboardSnapshot, FiltrosDashboard } from "../types/dashboard";
import { esSnapshot } from "../types/dashboard";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

const CLAVE_FILTROS = "florhema.dashboard.filtros";

/** Horario oficial de Argentina (sin horario de verano desde 2019). */
const ZONA = "-03:00";

const filtrosSchema = z.object({
  periodo: z.enum([
    "hoy",
    "7d",
    "30d",
    "90d",
    "mesActual",
    "mesAnterior",
    "personalizado",
  ]),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  componente: z.string(),
  grupo: z.string(),
  estado: z.string(),
});

function fechaISO(date: Date): string {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

function filtrosPorDefecto(): FiltrosDashboard {
  const hoy = fechaISO(new Date());
  return {
    periodo: "30d",
    desde: sumarDias(hoy, -29),
    hasta: hoy,
    componente: "",
    grupo: "",
    estado: "",
  };
}

function leerFiltros(): FiltrosDashboard {
  const defecto = filtrosPorDefecto();
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_FILTROS);
    if (!guardado) return defecto;
    const parseado = filtrosSchema.safeParse(JSON.parse(guardado));
    return parseado.success ? parseado.data : defecto;
  } catch {
    return defecto;
  }
}

export type RangoDashboard = {
  desde: string;
  hasta: string;
  desdeISO: string;
  hastaISO: string;
};

export function calcularRango(filtros: FiltrosDashboard): RangoDashboard {
  const hoy = fechaISO(new Date());
  let desde = sumarDias(hoy, -29);
  let hasta = hoy;

  switch (filtros.periodo) {
    case "hoy":
      desde = hoy;
      break;
    case "7d":
      desde = sumarDias(hoy, -6);
      break;
    case "90d":
      desde = sumarDias(hoy, -89);
      break;
    case "mesActual":
      desde = `${hoy.slice(0, 7)}-01`;
      break;
    case "mesAnterior": {
      hasta = sumarDias(`${hoy.slice(0, 7)}-01`, -1);
      desde = `${hasta.slice(0, 7)}-01`;
      break;
    }
    case "personalizado":
      desde = filtros.desde;
      hasta = filtros.hasta;
      break;
    default:
      break;
  }

  if (desde > hasta) {
    desde = hasta;
  }

  return {
    desde,
    hasta,
    desdeISO: `${desde}T00:00:00.000${ZONA}`,
    hastaISO: `${sumarDias(hasta, 1)}T00:00:00.000${ZONA}`,
  };
}

export function useDashboard() {
  const [filtros, setFiltros] = useState<FiltrosDashboard>(leerFiltros);
  const [datos, setDatos] = useState<DashboardSnapshot | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [actualizadoEn, setActualizadoEn] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const rango = useMemo(() => calcularRango(filtros), [filtros]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CLAVE_FILTROS, JSON.stringify(filtros));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [filtros]);

  useEffect(() => {
    const controlador = new AbortController();
    const parametros = new URLSearchParams({
      desde: rango.desdeISO,
      hasta: rango.hastaISO,
      componente: filtros.componente,
      grupo: filtros.grupo,
      estado: filtros.estado,
    });

    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const respuesta = await fetch(
          `${API_URL}/api/dashboard/resumen?${parametros.toString()}`,
          { signal: controlador.signal },
        );
        const cuerpo: unknown = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
          const detalle =
            typeof cuerpo === "object" &&
            cuerpo !== null &&
            "error" in cuerpo &&
            typeof cuerpo.error === "string"
              ? cuerpo.error
              : "No se pudo consultar el resumen";
          throw new Error(detalle);
        }
        if (!esSnapshot(cuerpo)) {
          throw new Error("El servidor devolvió un resumen inválido");
        }
        setDatos(cuerpo);
        setActualizadoEn(new Date().toISOString());
      } catch (causa) {
        if (controlador.signal.aborted) return;
        setDatos(null);
        setError(
          causa instanceof Error ? causa.message : "No se pudo consultar el resumen",
        );
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }

    void cargar();
    return () => controlador.abort();
  }, [
    rango.desdeISO,
    rango.hastaISO,
    filtros.componente,
    filtros.grupo,
    filtros.estado,
    version,
  ]);

  const actualizarFiltros = useCallback((cambios: Partial<FiltrosDashboard>) => {
    setFiltros((previos) => ({ ...previos, ...cambios }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltros(filtrosPorDefecto());
  }, []);

  const verDia = useCallback((fecha: string) => {
    setFiltros((previos) => ({
      ...previos,
      periodo: "personalizado",
      desde: fecha,
      hasta: fecha,
    }));
  }, []);

  const recargar = useCallback(() => setVersion((previo) => previo + 1), []);

  return {
    filtros,
    datos,
    cargando,
    error,
    actualizadoEn,
    rango,
    actualizarFiltros,
    limpiarFiltros,
    recargar,
    verDia,
  };
}
