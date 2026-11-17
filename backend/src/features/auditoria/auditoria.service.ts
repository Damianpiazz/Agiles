import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parseDateRange, parsePositiveInt, type RawQuery } from "../../lib/query";
import { rangoDelDia } from "../../utils/formato";

export function filtroAuditoria(query: RawQuery): Prisma.AuditoriaWhereInput {
  const usuario = firstValue(query.usuario);
  const accion = firstValue(query.accion);
  const entidad = firstValue(query.entidad);
  const search = firstValue(query.q);
  const where: Prisma.AuditoriaWhereInput = {};

  if (usuario) where.usuario = { contains: usuario, mode: "insensitive" };
  if (accion) where.accion = { equals: accion.toUpperCase() };
  if (entidad) where.entidad = { contains: entidad, mode: "insensitive" };

  const rango = parseDateRange(query);
  if (rango.gte || rango.lte) {
    where.fechaHora = rangoDelDia(rango.gte, rango.lte);
  }

  if (search) {
    where.OR = [
      { usuario: { contains: search, mode: "insensitive" } },
      { entidad: { contains: search, mode: "insensitive" } },
      { detalle: { contains: search, mode: "insensitive" } },
      { entidadId: { contains: search } },
      { ruta: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listarAuditoria(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 50, 200);
  const where = filtroAuditoria(query as RawQuery);

  const [total, items] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({
      where,
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function obtenerAuditoria(id: number) {
  const evento = await prisma.auditoria.findUnique({ where: { id } });
  if (!evento) throw notFound(`No existe el evento de auditoría con id ${id}`);
  return evento;
}

/** Catálogos de filtros para la pantalla 10. */
export async function opcionesAuditoria() {
  const [acciones, entidades, usuarios] = await Promise.all([
    prisma.auditoria.findMany({ distinct: ["accion"], select: { accion: true }, orderBy: { accion: "asc" } }),
    prisma.auditoria.findMany({ distinct: ["entidad"], select: { entidad: true }, orderBy: { entidad: "asc" } }),
    prisma.auditoria.findMany({
      where: { usuario: { not: null } },
      distinct: ["usuario"],
      select: { usuario: true },
      orderBy: { usuario: "asc" },
    }),
  ]);

  return {
    acciones: acciones.map((item) => item.accion),
    entidades: entidades.map((item) => item.entidad),
    usuarios: usuarios.map((item) => item.usuario).filter((usuario): usuario is string => Boolean(usuario)),
  };
}
