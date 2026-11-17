import type { ReactNode } from "react";
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
}: DataTableProps<T>) {
  if (cargando) return <LoadingPanel />;
  if (error) return <StatePanel titulo="No se pudieron cargar los datos" mensaje={error} onReintentar={onReintentar} />;
  if (filas.length === 0) return <StatePanel titulo="Sin resultados" mensaje={vacio} />;

  return (
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
          {filas.map((fila) => {
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
  );
}
