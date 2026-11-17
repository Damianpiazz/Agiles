/**
 * Serializa filas a CSV respetando comillas y saltos de línea.
 */
export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  if (rows.length === 0) return "";
  const headers = columns ?? Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const text = value instanceof Date ? value.toISOString() : String(value);
    if (/[";\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [headers.join(";")];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(";"));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function sendCsv(
  res: import("express").Response,
  filename: string,
  rows: Array<Record<string, unknown>>,
  columns?: string[],
): void {
  const csv = toCsv(rows, columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
}
