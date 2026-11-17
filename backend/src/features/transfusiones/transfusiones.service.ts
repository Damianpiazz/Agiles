import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import {
  firstValue,
  parseDateRange,
  parsePositiveInt,
  type RawQuery,
} from "../../lib/query";
import { normalizarDocumento } from "../../utils/formato";
import { resolverPersona } from "../personas/personas.service";
import type { CreateTransfusionInput, UpdateTransfusionInput } from "./transfusiones.schema";

export const transfusionInclude = {
  persona: {
    include: {
      grupoFactor: true,
      direccion: { include: { ciudad: { include: { provincia: true } } } },
    },
  },
  grupoFactor: true,
  fenotipo1: true,
  fenotipo2: true,
  tipoTransfusion: true,
} satisfies Prisma.TransfusionInclude;

type TransfusionCompleta = Prisma.TransfusionGetPayload<{ include: typeof transfusionInclude }>;

export type EstadoCompatibilidad = "COMPATIBLE" | "INCOMPATIBLE" | "SIN_DATOS";

function clasificarCompatibilidad(rt: string | null): EstadoCompatibilidad {
  if (!rt) return "SIN_DATOS";
  const texto = rt.trim().toLowerCase();
  if (/(incompatible|no\s+compatible|positivo)/.test(texto)) return "INCOMPATIBLE";
  if (/(compatible|negativo)/.test(texto)) return "COMPATIBLE";
  return "SIN_DATOS";
}

function mapTransfusion(transfusion: TransfusionCompleta) {
  return {
    ...transfusion,
    grupoFactor: transfusion.grupoFactor ?? transfusion.persona?.grupoFactor ?? null,
    estadoCompatibilidad: clasificarCompatibilidad(transfusion.rt),
  };
}

/** Construye el filtro compartido por el listado y los reportes. */
export function filtroTransfusiones(query: RawQuery): Prisma.TransfusionWhereInput {
  const personaId = firstValue(query.personaId);
  const dni = firstValue(query.dni);
  const tipo = firstValue(query.idTipoTransfusion);
  const search = firstValue(query.q);
  const where: Prisma.TransfusionWhereInput = {};

  if (personaId) where.idPersona = Number(personaId);
  if (tipo) where.idTipoTransfusion = Number(tipo);
  if (dni) where.persona = { dni: normalizarDocumento(dni) };

  const rango = parseDateRange(query);
  if (rango.gte || rango.lte) where.fecha = rango;

  if (search) {
    const documento = normalizarDocumento(search);
    where.OR = [
      { numeroOLote: { contains: search, mode: "insensitive" } },
      { tecnico: { contains: search, mode: "insensitive" } },
      { persona: { dni: { contains: documento } } },
      { persona: { nombre: { contains: search, mode: "insensitive" } } },
      { persona: { apellido: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function listarTransfusiones(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const where = filtroTransfusiones(query as RawQuery);

  const [total, items] = await Promise.all([
    prisma.transfusion.count({ where }),
    prisma.transfusion.findMany({
      where,
      include: transfusionInclude,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items.map(mapTransfusion), meta: paginationMeta(page, limit, total) };
}

async function buscarTransfusion(id: number) {
  const transfusion = await prisma.transfusion.findUnique({
    where: { id },
    include: transfusionInclude,
  });
  if (!transfusion) throw notFound(`No existe la transfusión con id ${id}`);
  return transfusion;
}

export async function obtenerTransfusion(id: number) {
  return mapTransfusion(await buscarTransfusion(id));
}

export async function transfusionsDePersona(idPersona: number) {
  const persona = await prisma.persona.findUnique({ where: { id: idPersona }, select: { id: true } });
  if (!persona) throw notFound(`No existe la persona con id ${idPersona}`);

  const items = await prisma.transfusion.findMany({
    where: { idPersona },
    include: transfusionInclude,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });
  return items.map(mapTransfusion);
}

export async function crearTransfusion(input: CreateTransfusionInput) {
  const { persona, ...data } = input;
  let idPersona = data.idPersona ?? undefined;

  if (!idPersona && persona) {
    const creada = await resolverPersona(persona);
    idPersona = creada.id;
  }

  if (idPersona && data.idGrupoFactor) {
    await prisma.persona.update({ where: { id: idPersona }, data: { idGrupoFactor: data.idGrupoFactor } });
  }

  const transfusion = await prisma.transfusion.create({
    data: { ...data, idPersona },
    include: transfusionInclude,
  });
  return mapTransfusion(transfusion);
}

export async function actualizarTransfusion(id: number, input: UpdateTransfusionInput) {
  const transfusion = await prisma.transfusion.update({
    where: { id },
    data: input,
    include: transfusionInclude,
  });
  return mapTransfusion(transfusion);
}

export async function eliminarTransfusion(id: number) {
  await prisma.transfusion.delete({ where: { id } });
}
