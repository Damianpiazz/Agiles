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
import { calcularEdad, normalizarDocumento } from "../../utils/formato";
import { resolverPersona } from "../personas/personas.service";
import type { CreateSangriaInput, UpdateSangriaInput } from "./sangrias.schema";

export const sangriaInclude = {
  persona: {
    include: {
      grupoFactor: true,
      direccion: { include: { ciudad: { include: { provincia: true } } } },
    },
  },
  obraSocial: true,
  medico: true,
} satisfies Prisma.SangriaTerapeuticaInclude;

type SangriaCompleta = Prisma.SangriaTerapeuticaGetPayload<{ include: typeof sangriaInclude }>;

function mapSangria(sangria: SangriaCompleta) {
  return {
    ...sangria,
    edadPaciente: calcularEdad(sangria.persona?.fechaNacimiento),
  };
}

export function filtroSangrias(query: RawQuery): Prisma.SangriaTerapeuticaWhereInput {
  const personaId = firstValue(query.personaId);
  const dni = firstValue(query.dni);
  const idObraSocial = firstValue(query.idObraSocial);
  const idMedico = firstValue(query.idMedico);
  const search = firstValue(query.q);
  const where: Prisma.SangriaTerapeuticaWhereInput = {};

  if (personaId) where.idPersona = Number(personaId);
  if (idObraSocial) where.idObraSocial = Number(idObraSocial);
  if (idMedico) where.idMedico = Number(idMedico);
  if (dni) where.persona = { dni: normalizarDocumento(dni) };

  const rango = parseDateRange(query);
  if (rango.gte || rango.lte) where.fecha = rango;

  if (search) {
    const documento = normalizarDocumento(search);
    where.OR = [
      { diagnostico: { contains: search, mode: "insensitive" } },
      { tecnico: { contains: search, mode: "insensitive" } },
      { persona: { dni: { contains: documento } } },
      { persona: { nombre: { contains: search, mode: "insensitive" } } },
      { persona: { apellido: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function listarSangrias(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const where = filtroSangrias(query as RawQuery);

  const [total, items] = await Promise.all([
    prisma.sangriaTerapeutica.count({ where }),
    prisma.sangriaTerapeutica.findMany({
      where,
      include: sangriaInclude,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items.map(mapSangria), meta: paginationMeta(page, limit, total) };
}

async function buscarSangria(id: number) {
  const sangria = await prisma.sangriaTerapeutica.findUnique({
    where: { id },
    include: sangriaInclude,
  });
  if (!sangria) throw notFound(`No existe la sangría terapéutica con id ${id}`);
  return sangria;
}

export async function obtenerSangria(id: number) {
  return mapSangria(await buscarSangria(id));
}

export async function sangriasDePersona(idPersona: number) {
  const persona = await prisma.persona.findUnique({ where: { id: idPersona }, select: { id: true } });
  if (!persona) throw notFound(`No existe la persona con id ${idPersona}`);

  const items = await prisma.sangriaTerapeutica.findMany({
    where: { idPersona },
    include: sangriaInclude,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });
  return items.map(mapSangria);
}

export async function crearSangria(input: CreateSangriaInput) {
  const { persona, ...data } = input;
  let idPersona = data.idPersona ?? undefined;

  if (!idPersona && persona) {
    const creada = await resolverPersona(persona);
    idPersona = creada.id;
  }

  const sangria = await prisma.sangriaTerapeutica.create({
    data: { ...data, idPersona },
    include: sangriaInclude,
  });
  return mapSangria(sangria);
}

export async function actualizarSangria(id: number, input: UpdateSangriaInput) {
  const sangria = await prisma.sangriaTerapeutica.update({
    where: { id },
    data: input,
    include: sangriaInclude,
  });
  return mapSangria(sangria);
}

export async function eliminarSangria(id: number) {
  await prisma.sangriaTerapeutica.delete({ where: { id } });
}
