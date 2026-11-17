import { prisma } from "../../config/prisma";
import { conflict, notFound } from "../../lib/errors";
import { hashPassword } from "../../lib/security";
import { paginationMeta } from "../../lib/http";
import { firstValue, parsePositiveInt } from "../../lib/query";
import { toPublicUsuario } from "./usuarios.utils";
import type { CreateUsuarioInput, UpdateUsuarioInput } from "./usuarios.schema";

export async function listarUsuarios(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const search = firstValue(query.q);
  const rol = firstValue(query.rol);
  const estado = firstValue(query.estado);

  const where: Record<string, unknown> = {};
  if (rol) where.rol = rol;
  if (estado) where.estado = estado;
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: "insensitive" } },
      { apellido: { contains: search, mode: "insensitive" } },
      { usuario: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      orderBy: { apellido: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: rows.map(toPublicUsuario), meta: paginationMeta(page, limit, total) };
}

export async function obtenerUsuario(id: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw notFound(`No existe el usuario con id ${id}`);
  return toPublicUsuario(usuario);
}

export async function crearUsuario(input: CreateUsuarioInput) {
  const existente = await prisma.usuario.findUnique({ where: { usuario: input.usuario } });
  if (existente) throw conflict(`El nombre de usuario "${input.usuario}" ya está en uso`);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre,
      apellido: input.apellido,
      usuario: input.usuario,
      passwordHash: hashPassword(input.password),
      rol: input.rol,
      estado: input.estado,
    },
  });
  return toPublicUsuario(usuario);
}

export async function actualizarUsuario(id: number, input: UpdateUsuarioInput) {
  const { password, ...rest } = input;
  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });
  return toPublicUsuario(usuario);
}

export async function eliminarUsuario(id: number) {
  await prisma.usuario.delete({ where: { id } });
}
