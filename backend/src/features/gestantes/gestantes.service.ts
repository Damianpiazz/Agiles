import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parseDateRange, parsePositiveInt } from "../../lib/query";
import { normalizarDocumento } from "../../utils/formato";
import { personaRelaciones } from "../personas/personas.service";
import type { GestanteCompletaInput } from "./gestantes.schema";

export const gestanteInclude = {
  gestante: { include: personaRelaciones },
  pciAsociados: {
    include: {
      pci: {
        include: {
          resultados: { include: { antigeno: true }, orderBy: { id: "asc" } },
        },
      },
    },
  },
} satisfies Prisma.EstudioInmunohematologicoGestanteInclude;

export async function listarGestantes(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const search = firstValue(query.q);
  const personaId = firstValue(query.personaId);
  const rango = parseDateRange(query);

  const where: Prisma.EstudioInmunohematologicoGestanteWhereInput = {};
  if (personaId) where.idPersona = Number(personaId);
  if (rango.gte || rango.lte) where.fecha = rango;
  if (search) {
    const documento = normalizarDocumento(search);
    where.gestante = {
      OR: [
        { dni: { contains: documento } },
        { nombre: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [total, items] = await Promise.all([
    prisma.estudioInmunohematologicoGestante.count({ where }),
    prisma.estudioInmunohematologicoGestante.findMany({
      where,
      include: gestanteInclude,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function obtenerGestante(id: number) {
  const estudio = await prisma.estudioInmunohematologicoGestante.findUnique({
    where: { id },
    include: gestanteInclude,
  });
  if (!estudio) throw notFound(`No existe el estudio de gestante con id ${id}`);
  return estudio;
}

export async function listarPorPersona(idPersona: number) {
  return prisma.estudioInmunohematologicoGestante.findMany({
    where: { idPersona },
    include: gestanteInclude,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });
}

export async function crearGestante(input: {
  numero?: string;
  fecha?: Date | null;
  operador?: string;
  idPersona: number;
}) {
  return prisma.estudioInmunohematologicoGestante.create({
    data: input,
    include: gestanteInclude,
  });
}

export async function actualizarGestante(
  id: number,
  input: { numero?: string; fecha?: Date | null; operador?: string; idPersona?: number },
) {
  return prisma.estudioInmunohematologicoGestante.update({
    where: { id },
    data: input,
    include: gestanteInclude,
  });
}

export async function eliminarGestante(id: number) {
  await prisma.$transaction(async (tx) => {
    await tx.pciInmunohematologicoGestante.deleteMany({
      where: { idEstudiosInmunohematologicosGestante: id },
    });
    await tx.estudioInmunohematologicoGestante.delete({ where: { id } });
  });
}

/**
 * Alta completa desde la pantalla 06: resuelve la persona, registra uno o dos
 * PCI (estudio y compatibilidad conyugal) y los asocia al estudio de gestante.
 */
export async function guardarGestanteCompleta(input: GestanteCompletaInput) {
  return prisma.$transaction(async (tx) => {
    let idPersona = input.idPersona ?? undefined;

    if (input.persona) {
      const dni = input.persona.dni;
      const existente = await tx.persona.findFirst({ where: { dni } });
      if (existente) {
        const actualizada = await tx.persona.update({
          where: { id: existente.id },
          data: input.persona,
        });
        idPersona = actualizada.id;
      } else {
        const creada = await tx.persona.create({ data: input.persona });
        idPersona = creada.id;
      }
    }

    if (!idPersona) throw badRequest("No se pudo resolver la persona del estudio");

    const persona = await tx.persona.findUnique({ where: { id: idPersona } });
    if (!persona) throw notFound(`No existe la persona con id ${idPersona}`);

    const idsPci: number[] = [];
    for (const estudioPci of [input.pci, input.compatibilidadConyugal]) {
      if (!estudioPci) continue;
      const pci = await tx.pci.create({
        data: {
          fecha: estudioPci.fecha,
          hora: new Date(
            Date.UTC(
              1970,
              0,
              1,
              Number(estudioPci.hora.slice(0, 2)),
              Number(estudioPci.hora.slice(3, 5)),
              Number(estudioPci.hora.slice(6, 8) || 0),
            ),
          ),
          operador: estudioPci.operador,
          observaciones: estudioPci.observaciones,
          resultados: estudioPci.resultados?.length
            ? {
                create: estudioPci.resultados.map((resultado) => ({
                  antigenoId: resultado.antigenoId,
                  resultado: resultado.resultado,
                  intensidad: resultado.intensidad,
                  observacion: resultado.observacion,
                })),
              }
            : undefined,
        },
      });
      idsPci.push(pci.id);
    }

    const estudio = await tx.estudioInmunohematologicoGestante.create({
      data: {
        numero: input.estudio.numero,
        fecha: input.estudio.fecha,
        operador: input.estudio.operador,
        idPersona,
        pciAsociados: {
          create: idsPci.map((idPci) => ({ idPci })),
        },
      },
      include: gestanteInclude,
    });

    return estudio;
  });
}
