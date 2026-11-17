import { useEffect, useState, type ReactNode } from "react";
import { POR_PAGINA } from "@/shared/hooks/usePaginacion";
import type { PaginationMeta } from "@/shared/types/api";
import { Paginacion } from "./Paginacion";
import { LoadingPanel, StatePanel } from "./StatePanel";

export interface Columna<T> {
  clave: string;
  titulo: string;
  celda: (fila: T) => ReactNode;
  numerica?: boolean;
}

interface DataTableProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  claveFila: (fila: T) => string | number;
  cargando?: boolean;
  error?: string;
  vacio?: string;
  seleccionada?: number | null;
  onReintentar?: () => void;
  /** Paginación local por defecto. Con `meta` + `onCambiarPagina`, la pagina el servidor. */
  porPagina?: number;
  meta?: PaginationMeta;
  pagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  /** Cambia este valor para volver a la página 1 (búsquedas, filtros, registro activo). */
  claveReset?: unknown;
}

export function DataTable<T>({
  columnas,
  filas,
  claveFila,
  cargando = false,
  error,
  vacio = "Sin registros para este filtro.",
  seleccionada = null,
  onReintentar,
  porPagina = POR_PAGINA,
  meta,
  pagina: paginaControlada,
  onCambiarPagina,
  claveReset,
}: DataTableProps<T>) {
  const [estadoLocal, setEstadoLocal] = useState({ clave: claveReset, pagina: 1 });

  if (estadoLocal.clave !== claveReset) {
    setEstadoLocal({ clave: claveReset, pagina: 1 });
  }

  const servidor = Boolean(meta && onCambiarPagina);
  const total = meta?.total ?? filas.length;
  const totalPaginas = meta?.totalPages ?? Math.ceil(filas.length / porPagina);
  const paginaLocal = Math.min(
    estadoLocal.clave === claveReset ? estadoLocal.pagina : 1,
    Math.max(1, totalPaginas),
  );
  const pagina = servidor ? (paginaControlada ?? meta?.page ?? 1) : paginaLocal;

  useEffect(() => {
    if (servidor && totalPaginas > 0 && pagina > totalPaginas) onCambiarPagina?.(totalPaginas);
  }, [pagina, totalPaginas, servidor, onCambiarPagina]);

  if (cargando) return <LoadingPanel />;
  if (error) return <StatePanel titulo="No se pudieron cargar los datos" mensaje={error} onReintentar={onReintentar} />;
  if (filas.length === 0) return <StatePanel titulo="Sin resultados" mensaje={vacio} />;

  const filasVisibles = servidor ? filas : filas.slice((pagina - 1) * porPagina, pagina * porPagina);
  const cambiarLocal = (paginaNueva: number) => setEstadoLocal({ clave: claveReset, pagina: paginaNueva });

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.clave} scope="col" className={columna.numerica ? "table__num" : undefined}>
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasVisibles.map((fila) => {
              const id = claveFila(fila);
              return (
                <tr key={id} aria-selected={seleccionada === id ? true : undefined}>
                  {columnas.map((columna) => (
                    <td key={columna.clave} className={columna.numerica ? "table__num mono" : undefined}>
                      {columna.celda(fila)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Paginacion
        pagina={pagina}
        total={total}
        porPagina={porPagina}
        totalPaginas={totalPaginas}
        onCambiar={servidor ? onCambiarPagina! : cambiarLocal}
        deshabilitado={cargando}
      />
    </>
  );
}
