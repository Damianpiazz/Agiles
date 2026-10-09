import { prisma } from "../config/prisma";
import type {
  CrearSerologiaInput,
  FiltroSerologiaInput,
} from "../types/serologia.types";

/**
 * Superficie mínima de Prisma que usa este servicio.
 * Se declara como parámetro inyectable para poder testear sin base de datos.
 */
export type SerologiaDb = {
  serologia: {
    create(args: { data: any; include?: any }): Promise<unknown>;
    findUnique(args: { where: { id: number }; include?: any }): Promise<unknown>;
    findMany(args: {
      where: any;
      include?: any;
      orderBy?: any;
    }): Promise<unknown>;
  };
};

const includeRelaciones = {
  resultados: { include: { determinacionSerologica: true } },
  donaciones: true,
} as const;

/** Convierte "HH:MM" en el Date que Prisma mapea a una columna TIME. */
export function aHora(hora: string): Date {
  return new Date(`1970-01-01T${hora}:00.000Z`);
}

export async function create(
  datos: CrearSerologiaInput,
  db: SerologiaDb = prisma,
) {
  return db.serologia.create({
    data: {
      fecha: datos.fecha,
      hora: aHora(datos.hora),
      observaciones: datos.observaciones || null,
      resultados: {
        create: datos.resultados.map((r) => ({
          determinacionSerologicaId: r.determinacionSerologicaId,
          resultado: r.resultado,
          valor: r.valor || null,
          unidad: r.unidad || null,
          observacion: r.observacion || null,
        })),
      },
      donaciones: {
        create: datos.donacionIds.map((donacionId) => ({ donacionId })),
      },
    },
    include: includeRelaciones,
  });
}

export async function buscarPorId(id: number, db: SerologiaDb = prisma) {
  return db.serologia.findUnique({
    where: { id },
    include: includeRelaciones,
  });
}

export async function listar(
  filtro: FiltroSerologiaInput,
  db: SerologiaDb = prisma,
) {
  return db.serologia.findMany({
    where: filtro.donacionId
      ? { donaciones: { some: { donacionId: filtro.donacionId } } }
      : {},
    include: includeRelaciones,
    orderBy: { fecha: "desc" },
  });
}
