import { useState } from "react";

/** Tamaño de página usado por defecto en las tablas del sistema. */
export const POR_PAGINA = 10;

/**
 * Mantiene la página actual y la reinicia cuando cambian los filtros.
 * Los parámetros devueltos se pueden pasar directamente a las APIs de listado.
 */
export function usePaginacion(claveReset: unknown, porPagina = POR_PAGINA) {
  const [estado, setEstado] = useState({ clave: claveReset, pagina: 1 });

  if (estado.clave !== claveReset) {
    setEstado({ clave: claveReset, pagina: 1 });
  }

  const pagina = estado.clave === claveReset ? estado.pagina : 1;
  const setPagina = (paginaNueva: number) => setEstado({ clave: claveReset, pagina: paginaNueva });

  return {
    pagina,
    porPagina,
    setPagina,
    params: { page: pagina, limit: porPagina },
  };
}
