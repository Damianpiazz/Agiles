import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EmptyState, LoadingState } from "./States";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
};

export type DataTableFilter = {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
};

type Props<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string | number;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  filterRow?: (row: T) => boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSizeOptions?: readonly number[];
  caption?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
};

const PAGE_SIZES = [10, 25, 50] as const;

function toComparable(value: string | number): string | number {
  return typeof value === "string" ? value.toLocaleLowerCase("es-AR") : value;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = "Buscar en los resultados…",
  filters = [],
  filterRow,
  loading = false,
  emptyTitle = "No hay registros para mostrar",
  emptyDescription,
  pageSizeOptions = PAGE_SIZES,
  caption,
  onRowClick,
  rowClassName,
}: Props<T>) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ id: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[0] ?? 10);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-AR");
    const result = rows.filter((row) => {
      if (filterRow && !filterRow(row)) return false;
      if (!normalized) return true;
      return (searchText ? searchText(row) : "")
        .toLocaleLowerCase("es-AR")
        .includes(normalized);
    });

    if (!sort) return result;
    const column = columns.find((item) => item.id === sort.id);
    if (!column?.sortValue) return result;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...result].sort((a, b) => {
      const left = toComparable(column.sortValue!(a));
      const right = toComparable(column.sortValue!(b));
      if (left < right) return -1 * factor;
      if (left > right) return 1 * factor;
      return 0;
    });
  }, [rows, query, filterRow, searchText, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(id: string) {
    setPage(1);
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, direction: "asc" };
      if (prev.direction === "asc") return { id, direction: "desc" };
      return null;
    });
  }

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changeFilter(filter: DataTableFilter, value: string) {
    filter.onChange(value);
    setPage(1);
  }

  const first = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, filtered.length);

  return (
    <div className="ui-data-table">
      <div className="ui-table-toolbar">
        <div className="ui-search">
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor={`${uid}-search`}>
            {searchPlaceholder}
          </label>
          <input
            id={`${uid}-search`}
            type="search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        {filters.map((filter) => (
          <div className="ui-filter" key={filter.id}>
            <label htmlFor={`${uid}-filter-${filter.id}`}>{filter.label}</label>
            <select
              id={`${uid}-filter-${filter.id}`}
              value={filter.value}
              onChange={(event) => changeFilter(filter, event.target.value)}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p className="ui-table-count" role="status">
        {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
        {filtered.length > 0 ? ` · mostrando ${first}–${last}` : ""}
      </p>

      {loading ? (
        <LoadingState label="Cargando registros…" />
      ) : visible.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="ui-table-scroll" tabIndex={0} role="region" aria-label={caption ?? "Tabla de resultados"}>
          <table className="ui-table">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((column) => {
                  const isSorted = sort?.id === column.id;
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      className={column.className}
                      aria-sort={
                        isSorted
                          ? sort?.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          className="ui-sort-button"
                          onClick={() => toggleSort(column.id)}
                        >
                          {column.header}
                          <span aria-hidden="true">
                            {isSorted ? (sort?.direction === "asc" ? " ↑" : " ↓") : " ↕"}
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={
                    [onRowClick ? "ui-row-clickable" : "", rowClassName?.(row)]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td key={column.id} className={column.className}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="ui-pagination">
          <div className="ui-page-size">
            <label htmlFor={`${uid}-page-size`}>Registros por página</label>
            <select
              id={`${uid}-page-size`}
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="ui-page-controls">
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              ← Anterior
            </button>
            <span aria-live="polite">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
