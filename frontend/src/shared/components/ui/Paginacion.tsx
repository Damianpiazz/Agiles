import { POR_PAGINA } from "@/shared/hooks/usePaginacion";

interface PaginacionProps {
  pagina: number;
  total: number;
  onCambiar: (pagina: number) => void;
  porPagina?: number;
  totalPaginas?: number;
  deshabilitado?: boolean;
}

/** Números de página visibles, con "…" para los intervalos omitidos. */
function paginasVisibles(actual: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1);

  const inicio = Math.max(2, actual - 1);
  const fin = Math.min(total - 1, actual + 1);
  const paginas: Array<number | "…"> = [1];
  if (inicio > 2) paginas.push("…");
  for (let numero = inicio; numero <= fin; numero += 1) paginas.push(numero);
  if (fin < total - 1) paginas.push("…");
  paginas.push(total);
  return paginas;
}

export function Paginacion({
  pagina,
  total,
  onCambiar,
  porPagina = POR_PAGINA,
  totalPaginas,
  deshabilitado = false,
}: PaginacionProps) {
  const paginas = totalPaginas ?? Math.ceil(total / porPagina);
  if (paginas <= 1) return null;

  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <nav className="paginacion" aria-label="Paginación de resultados">
      <span className="paginacion__info" aria-live="polite">
        Mostrando {desde}–{hasta} de {total}
      </span>
      <div className="paginacion__controles">
        <button
          type="button"
          className="paginacion__btn paginacion__btn--nav"
          onClick={() => onCambiar(pagina - 1)}
          disabled={deshabilitado || pagina <= 1}
          aria-label="Ir a la página anterior"
        >
          ← Anterior
        </button>
        {paginasVisibles(pagina, paginas).map((valor, indice) =>
          valor === "…" ? (
            <span className="paginacion__hueco" key={`hueco-${indice}`} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              type="button"
              key={valor}
              className={`paginacion__btn paginacion__num${valor === pagina ? " paginacion__num--actual" : ""}`}
              onClick={() => onCambiar(valor)}
              disabled={deshabilitado}
              aria-label={`Ir a la página ${valor}`}
              aria-current={valor === pagina ? "page" : undefined}
            >
              {valor}
            </button>
          ),
        )}
        <button
          type="button"
          className="paginacion__btn paginacion__btn--nav"
          onClick={() => onCambiar(pagina + 1)}
          disabled={deshabilitado || pagina >= paginas}
          aria-label="Ir a la página siguiente"
        >
          Siguiente →
        </button>
      </div>
    </nav>
  );
}
