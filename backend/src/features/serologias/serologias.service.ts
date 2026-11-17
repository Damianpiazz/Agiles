import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { conflict, notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parseDateRange, parsePositiveInt } from "../../lib/query";
import { horaADate, rangoDelDia } from "../../utils/formato";
import type { SerologiaResultadoInput } from "./serologias.schema";

export const serologiaInclude = {
  resultados: {
    include: { determinacionSerologica: true },
    orderBy: { id: "asc" },
  },
  donacionesDer: {
    include: {
      donacion: {
        include: {
          persona: true,
        },
      },
    },
  },
} satisfies Prisma.SerologiaInclude;

type SerologiaInput = {
  fecha?: Date;
  hora?: string;
  tipoMuestra?: "PRIMERA" | "SEGUNDA";
  operador?: string;
  observaciones?: string;
  resultados?: SerologiaResultadoInput[];
};

export async function listarSerologias(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const tipoMuestra = firstValue(query.tipoMuestra);
  const donacionId = firstValue(query.donacionId);
  const rango = parseDateRange(query);

  const where: Prisma.SerologiaWhereInput = {};
  if (tipoMuestra === "PRIMERA" || tipoMuestra === "SEGUNDA") where.tipoMuestra = tipoMuestra;
  if (donacionId) where.donacionesDer = { some: { idDonacion: Number(donacionId) } };
  if (rango.gte || rango.lte) where.fecha = rango;

  const [total, items] = await Promise.all([
    prisma.serologia.count({ where }),
    prisma.serologia.findMany({
      where,
      include: serologiaInclude,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function obtenerSerologia(id: number) {
  const serologia = await prisma.serologia.findUnique({ where: { id }, include: serologiaInclude });
  if (!serologia) throw notFound(`No existe la serología con id ${id}`);
  return serologia;
}

export async function crearSerologia(input: SerologiaInput) {
  return prisma.serologia.create({
    data: {
      fecha: input.fecha!,
      hora: horaADate(input.hora!),
      tipoMuestra: input.tipoMuestra,
      operador: input.operador,
      observaciones: input.observaciones,
      resultados: input.resultados?.length
        ? {
            create: input.resultados.map((resultado) => ({
              determinacionSerologicaId: resultado.determinacionSerologicaId,
              resultado: resultado.resultado,
              valor: resultado.valor,
              unidad: resultado.unidad,
              observacion: resultado.observacion,
            })),
          }
        : undefined,
    },
    include: serologiaInclude,
  });
}

export async function actualizarSerologia(id: number, input: SerologiaInput) {
  const { resultados, hora, ...rest } = input;
  return prisma.$transaction(async (tx) => {
    const exists = await tx.serologia.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw notFound(`No existe la serología con id ${id}`);

    if (resultados) {
      await tx.serologiaResultado.deleteMany({ where: { serologiaId: id } });
    }

    return tx.serologia.update({
      where: { id },
      data: {
        ...rest,
        ...(hora ? { hora: horaADate(hora) } : {}),
        ...(resultados?.length
          ? {
              resultados: {
                create: resultados.map((resultado) => ({
                  determinacionSerologicaId: resultado.determinacionSerologicaId,
                  resultado: resultado.resultado,
                  valor: resultado.valor,
                  unidad: resultado.unidad,
                  observacion: resultado.observacion,
                })),
              },
            }
          : {}),
      },
      include: serologiaInclude,
    });
  });
}

export async function eliminarSerologia(id: number) {
  await prisma.$transaction(async (tx) => {
    await tx.serologiaResultado.deleteMany({ where: { serologiaId: id } });
    await tx.serologiaDonacionDer.deleteMany({ where: { idSerologia: id } });
    await tx.serologia.delete({ where: { id } });
  });
}

export async function vincularDonacion(idSerologia: number, idDonacion: number) {
  const existente = await prisma.serologiaDonacionDer.findFirst({
    where: { idSerologia, idDonacion },
  });
  if (existente) throw conflict("La serología ya está vinculada a esa donación");

  await prisma.serologia.update({
    where: { id: idSerologia },
    data: { donacionesDer: { create: { idDonacion } } },
  });
  return obtenerSerologia(idSerologia);
}

export async function desvincularDonacion(idSerologia: number, idDonacion: number) {
  const result = await prisma.serologiaDonacionDer.deleteMany({
    where: { idSerologia, idDonacion },
  });
  if (result.count === 0) throw notFound("El vínculo entre la serología y la donación no existe");
  return obtenerSerologia(idSerologia);
}

/** Filas de resultados para filtros por fecha/donación en pantalla 14. */
export async function serologiasDeDonacion(idDonacion: number) {
  const vinculos = await prisma.serologiaDonacionDer.findMany({
    where: { idDonacion },
    include: { serologia: { include: serologiaInclude } },
    orderBy: { id: "asc" },
  });
  return vinculos.map((vinculo) => vinculo.serologia);
}

export { rangoDelDia };
