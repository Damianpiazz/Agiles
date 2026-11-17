/**
 * Utilidades de formato y cálculo usadas por varios módulos.
 */

export function calcularEdad(fechaNacimiento: Date | string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const fecha = typeof fechaNacimiento === "string" ? new Date(fechaNacimiento) : fechaNacimiento;
  if (Number.isNaN(fecha.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad -= 1;
  return edad;
}

export function normalizarDocumento(documento: string): string {
  return documento.replace(/[.\s-]/g, "");
}

/** Convierte "HH:mm" en el Date que Prisma espera para @db.Time. */
export function horaADate(hora: string): Date {
  const [hours = "0", minutes = "0", seconds = "0"] = hora.split(":");
  return new Date(Date.UTC(1970, 0, 1, Number(hours), Number(minutes), Number(seconds)));
}

/** Devuelve el inicio y el fin del día para filtrar campos @db.Date. */
export function rangoDelDia(desde?: Date, hasta?: Date): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (desde) {
    const start = new Date(desde);
    start.setUTCHours(0, 0, 0, 0);
    range.gte = start;
  }
  if (hasta) {
    const end = new Date(hasta);
    end.setUTCHours(23, 59, 59, 999);
    range.lte = end;
  }
  return range;
}

export function nombreCompleto(persona: {
  apellido?: string | null;
  nombre?: string | null;
} | null | undefined): string {
  if (!persona) return "";
  return [persona.apellido, persona.nombre].filter(Boolean).join(", ");
}
