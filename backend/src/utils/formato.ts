function aDate(valor: Date | string): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

/** Devuelve la hora en formato "HH:MM" (en UTC, que es como se guarda la columna TIME). */
export function formatearHora(valor: Date | string): string {
  const d = aDate(valor);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Devuelve la fecha en formato "YYYY-MM-DD". */
export function formatearFecha(valor: Date | string): string {
  const d = aDate(valor);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
