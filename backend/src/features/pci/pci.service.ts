import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { conflict, notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parseDateRange, parsePositiveInt } from "../../lib/query";
import { horaADate } from "../../utils/formato";
import type { PciResultadoInput } from "./pci.schema";

export const pciInclude = {
  resultados: { include: { antigeno: true }, orderBy: { id: "asc" } },
  donacionesDer: { include: { donacion: { include: { persona: true } } } },
  estudiosRn: { select: { id: true, numero: true, fecha: true, rn: true, dni: true } },
  estudiosGestantes: {
    select: { id: true, estudioGestante: { select: { id: true, numero: true, idPersona: true } } },
  },
} satisfies Prisma.PciInclude;

type PciInput = {
  fecha?: Date;
  hora?: string;
  operador?: string;
  observaciones?: string;
  resultados?: PciResultadoInput[];
};

export async function listarPci(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const donacionId = firstValue(query.donacionId);
  const rango = parseDateRange(query);

  const where: Prisma.PciWhereInput = {};
  if (donacionId) where.donacionesDer = { some: { idDonacion: Number(donacionId) } };
  if (rango.gte || rango.lte) where.fecha = rango;

  const [total, items] = await Promise.all([
    prisma.pci.count({ where }),
    prisma.pci.findMany({
      where,
      include: pciInclude,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function obtenerPci(id: number) {
  const pci = await prisma.pci.findUnique({ where: { id }, include: pciInclude });
  if (!pci) throw notFound(`No existe el PCI con id ${id}`);
  return pci;
}

export async function crearPci(input: PciInput) {
  return prisma.pci.create({
    data: {
      fecha: input.fecha!,
      hora: horaADate(input.hora!),
      operador: input.operador,
      observaciones: input.observaciones,
      resultados: input.resultados?.length
        ? {
            create: input.resultados.map((resultado) => ({
              antigenoId: resultado.antigenoId,
              resultado: resultado.resultado,
              intensidad: resultado.intensidad,
              observacion: resultado.observacion,
            })),
          }
        : undefined,
    },
    include: pciInclude,
  });
}

export async function actualizarPci(id: number, input: PciInput) {
  const { resultados, hora, ...rest } = input;
  return prisma.$transaction(async (tx) => {
    const exists = await tx.pci.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw notFound(`No existe el PCI con id ${id}`);

    if (resultados) {
      await tx.pciResultado.deleteMany({ where: { pciId: id } });
    }

    return tx.pci.update({
      where: { id },
      data: {
        ...rest,
        ...(hora ? { hora: horaADate(hora) } : {}),
        ...(resultados?.length
          ? {
              resultados: {
                create: resultados.map((resultado) => ({
                  antigenoId: resultado.antigenoId,
                  resultado: resultado.resultado,
                  intensidad: resultado.intensidad,
                  observacion: resultado.observacion,
                })),
              },
            }
          : {}),
      },
      include: pciInclude,
    });
  });
}

export async function eliminarPci(id: number) {
  await prisma.$transaction(async (tx) => {
    await tx.pciResultado.deleteMany({ where: { pciId: id } });
    await tx.pciDonacionDer.deleteMany({ where: { idPci: id } });
    await tx.pciInmunohematologicoGestante.deleteMany({ where: { idPci: id } });
    await tx.estudioInmunohematologicoRn.updateMany({ where: { idPci: id }, data: { idPci: null } });
    await tx.pci.delete({ where: { id } });
  });
}

export async function vincularPciDonacion(idPci: number, idDonacion: number) {
  const existente = await prisma.pciDonacionDer.findFirst({ where: { idPci, idDonacion } });
  if (existente) throw conflict("El PCI ya está vinculado a esa donación");
  await prisma.pci.update({ where: { id: idPci }, data: { donacionesDer: { create: { idDonacion } } } });
  return obtenerPci(idPci);
}

export async function desvincularPciDonacion(idPci: number, idDonacion: number) {
  const result = await prisma.pciDonacionDer.deleteMany({ where: { idPci, idDonacion } });
  if (result.count === 0) throw notFound("El vínculo entre el PCI y la donación no existe");
  return obtenerPci(idPci);
}
