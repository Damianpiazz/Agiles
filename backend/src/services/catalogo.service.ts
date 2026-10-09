import { prisma } from "../config/prisma";

export async function listarAntigenos() {
  return prisma.antigeno.findMany({ orderBy: { nombre: "asc" } });
}

export async function listarDeterminacionesSerologicas() {
  return prisma.determinacionSerologica.findMany({ orderBy: { nombre: "asc" } });
}
