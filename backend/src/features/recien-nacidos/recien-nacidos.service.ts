import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parseDateRange, parsePositiveInt } from "../../lib/query";
import { horaADate, normalizarDocumento } from "../../utils/formato";
import { personaRelaciones } from "../personas/personas.service";
import type { RnCompletoInput } from "./recien-nacidos.schema";

export const rnInclude = {
  madre: { include: personaRelaciones },
  grupoFactor: true,
  pcd: { include: { resultados: { include: { determinacionPcd: true }, orderBy: { id: "asc" } } } },
  pci: { include: { resultados: { include: { antigeno: true }, orderBy: { id: "asc" } } } },
} satisfies Prisma.EstudioInmunohematologicoRnInclude;

type RnInput = {
  numero?: string;
  fecha?: Date | null;
  rn?: string;
  dni?: string;
  idMadre?: number | null;
  idGrupoFactor?: number | null;
  ipAntiD?: string;
  idPcd?: number | null;
  idPci?: number | null;
  operador?: string;
  observaciones?: string;
};

export async function listarRecienNacidos(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const search = firstValue(query.q);
  const madreId = firstValue(query.madreId);
  const dni = firstValue(query.dni);
  const rango = parseDateRange(query);

  const where: Prisma.EstudioInmunohematologicoRnWhereInput = {};
  if (madreId) where.idMadre = Number(madreId);
  if (dni) where.dni = normalizarDocumento(dni);
  if (rango.gte || rango.lte) where.fecha = rango;
  if (search) {
    const documento = normalizarDocumento(search);
    where.OR = [
      { dni: { contains: documento } },
      { rn: { contains: search, mode: "insensitive" } },
      { madre: { dni: { contains: documento } } },
      { madre: { nombre: { contains: search, mode: "insensitive" } } },
      { madre: { apellido: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.estudioInmunohematologicoRn.count({ where }),
    prisma.estudioInmunohematologicoRn.findMany({
      where,
      include: rnInclude,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function obtenerRecienNacido(id: number) {
  const estudio = await prisma.estudioInmunohematologicoRn.findUnique({ where: { id }, include: rnInclude });
  if (!estudio) throw notFound(`No existe el estudio de recién nacido con id ${id}`);
  return estudio;
}

export async function crearRecienNacido(input: RnInput) {
  return prisma.estudioInmunohematologicoRn.create({ data: input, include: rnInclude });
}

export async function actualizarRecienNacido(id: number, input: RnInput) {
  return prisma.estudioInmunohematologicoRn.update({
    where: { id },
    data: input,
    include: rnInclude,
  });
}

export async function eliminarRecienNacido(id: number) {
  await prisma.estudioInmunohematologicoRn.delete({ where: { id } });
}

/** Alta desde pantalla 06: crea PCI/PCD y los asocia al estudio del RN. */
export async function guardarRecienNacidoCompleto(input: RnCompletoInput) {
  return prisma.$transaction(async (tx) => {
    let idPci = input.estudio.idPci ?? null;
    let idPcd = input.estudio.idPcd ?? null;

    if (input.pci) {
      const pci = await tx.pci.create({
        data: {
          fecha: input.pci.fecha,
          hora: horaADate(input.pci.hora),
          operador: input.pci.operador,
          observaciones: input.pci.observaciones,
          resultados: input.pci.resultados?.length
            ? {
                create: input.pci.resultados.map((resultado) => ({
                  antigenoId: resultado.antigenoId,
                  resultado: resultado.resultado,
                  intensidad: resultado.intensidad,
                  observacion: resultado.observacion,
                })),
              }
            : undefined,
        },
      });
      idPci = pci.id;
    }

    if (input.pcd) {
      const pcd = await tx.pcd.create({
        data: {
          fecha: input.pcd.fecha,
          hora: horaADate(input.pcd.hora),
          operador: input.pcd.operador,
          observaciones: input.pcd.observaciones,
          resultados: input.pcd.resultados?.length
            ? {
                create: input.pcd.resultados.map((resultado) => ({
                  idDeterminacionPcd: resultado.idDeterminacionPcd ?? null,
                  resultado: resultado.resultado,
                  valor: resultado.valor,
                  unidad: resultado.unidad,
                  observacion: resultado.observacion,
                })),
              }
            : undefined,
        },
      });
      idPcd = pcd.id;
    }

    return tx.estudioInmunohematologicoRn.create({
      data: { ...input.estudio, idPci, idPcd },
      include: rnInclude,
    });
  });
}
