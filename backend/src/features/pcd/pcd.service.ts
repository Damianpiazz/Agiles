import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { parseDateRange, parsePositiveInt } from "../../lib/query";
import { horaADate } from "../../utils/formato";
import type { PcdResultadoInput } from "./pcd.schema";

export const pcdInclude = {
  resultados: { include: { determinacionPcd: true }, orderBy: { id: "asc" } },
  estudiosRn: { select: { id: true, numero: true, fecha: true, rn: true, dni: true } },
} satisfies Prisma.PcdInclude;

type PcdInput = {
  fecha?: Date;
  hora?: string;
  operador?: string;
  observaciones?: string;
  resultados?: PcdResultadoInput[];
};

export async function listarPcd(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const rango = parseDateRange(query);

  const where: Prisma.PcdWhereInput = {};
  if (rango.gte || rango.lte) where.fecha = rango;

  const [total, items] = await Promise.all([
    prisma.pcd.count({ where }),
    prisma.pcd.findMany({
      where,
      include: pcdInclude,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function obtenerPcd(id: number) {
  const pcd = await prisma.pcd.findUnique({ where: { id }, include: pcdInclude });
  if (!pcd) throw notFound(`No existe el PCD con id ${id}`);
  return pcd;
}

export async function crearPcd(input: PcdInput) {
  return prisma.pcd.create({
    data: {
      fecha: input.fecha!,
      hora: horaADate(input.hora!),
      operador: input.operador,
      observaciones: input.observaciones,
      resultados: input.resultados?.length
        ? {
            create: input.resultados.map((resultado) => ({
              idDeterminacionPcd: resultado.idDeterminacionPcd ?? null,
              resultado: resultado.resultado,
              valor: resultado.valor,
              unidad: resultado.unidad,
              observacion: resultado.observacion,
            })),
          }
        : undefined,
    },
    include: pcdInclude,
  });
}

export async function actualizarPcd(id: number, input: PcdInput) {
  const { resultados, hora, ...rest } = input;
  return prisma.$transaction(async (tx) => {
    const exists = await tx.pcd.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw notFound(`No existe el PCD con id ${id}`);

    if (resultados) {
      await tx.pcdResultado.deleteMany({ where: { idPcd: id } });
    }

    return tx.pcd.update({
      where: { id },
      data: {
        ...rest,
        ...(hora ? { hora: horaADate(hora) } : {}),
        ...(resultados?.length
          ? {
              resultados: {
                create: resultados.map((resultado) => ({
                  idDeterminacionPcd: resultado.idDeterminacionPcd ?? null,
                  resultado: resultado.resultado,
                  valor: resultado.valor,
                  unidad: resultado.unidad,
                  observacion: resultado.observacion,
                })),
              },
            }
          : {}),
      },
      include: pcdInclude,
    });
  });
}

export async function eliminarPcd(id: number) {
  await prisma.$transaction(async (tx) => {
    await tx.pcdResultado.deleteMany({ where: { idPcd: id } });
    await tx.estudioInmunohematologicoRn.updateMany({ where: { idPcd: id }, data: { idPcd: null } });
    await tx.pcd.delete({ where: { id } });
  });
}
