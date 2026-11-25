import { prisma } from "../config/prisma";
import type {
  DashboardFiltros,
  DashboardSnapshot,
} from "../types/dashboard.types";

type FilaSnapshot = { snapshot: DashboardSnapshot };

/**
 * Única consulta del dashboard: invoca la función SQL que agrega todo el
 * snapshot en el servidor. No hay consultas por entidad ni N+1.
 */
export async function obtenerSnapshot(
  filtros: DashboardFiltros,
): Promise<DashboardSnapshot> {
  const desde = new Date(filtros.desde);
  const hasta = new Date(filtros.hasta);

  const filas = await prisma.$queryRaw<FilaSnapshot[]>`
    SELECT florhema_dashboard_snapshot(
      ${desde}::timestamptz,
      ${hasta}::timestamptz,
      ${filtros.componente}::text,
      ${filtros.grupo}::text,
      ${filtros.estado}::text
    ) AS snapshot
  `;

  if (filas.length === 0) {
    throw new Error("La función del dashboard no devolvió datos");
  }

  return filas[0].snapshot;
}
