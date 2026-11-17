import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parseDateRange, parsePositiveInt } from "../../lib/query";
import { horaADate, normalizarDocumento } from "../../utils/formato";
import { resolverPersona } from "../personas/personas.service";
import type {
  CreateDonacionInput,
  DonacionCompletaInput,
  GuardarEstudiosInput,
  UpdateDonacionInput,
} from "./donaciones.schema";

export const donacionInclude = {
  persona: {
    include: {
      grupoFactor: true,
      direccion: { include: { ciudad: { include: { provincia: true } } } },
    },
  },
  serologiaDonaciones: {
    include: {
      serologia: {
        include: {
          resultados: { include: { determinacionSerologica: true }, orderBy: { id: "asc" } },
        },
      },
    },
    orderBy: { id: "asc" },
  },
  pciDonaciones: {
    include: {
      pci: {
        include: { resultados: { include: { antigeno: true }, orderBy: { id: "asc" } } },
      },
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.DonacionDerInclude;

type DonacionConEstudios = Prisma.DonacionDerGetPayload<{ include: typeof donacionInclude }>;

export type EstadoEstudiosCodigo = "PENDIENTE" | "EN_CARGA" | "COMPLETO";

const ETIQUETA_ESTADO: Record<EstadoEstudiosCodigo, string> = {
  PENDIENTE: "Pendiente de carga",
  EN_CARGA: "En carga",
  COMPLETO: "Completo",
};

export function calcularEstadoEstudios(donacion: {
  serologiaDonaciones: Array<{
    serologia: { tipoMuestra: string | null; resultados: unknown[] };
  }>;
  pciDonaciones: Array<{ pci: { resultados: unknown[] } }>;
}): { codigo: EstadoEstudiosCodigo; etiqueta: string } {
  const serologias = donacion.serologiaDonaciones.map((item) => item.serologia);
  const primera = serologias.find((serologia) => serologia.tipoMuestra === "PRIMERA");
  const pci = donacion.pciDonaciones.find((item) => item.pci.resultados.length > 0);

  const tieneSerologia = Boolean(primera && primera.resultados.length > 0);
  const tienePci = Boolean(pci);

  let codigo: EstadoEstudiosCodigo = "PENDIENTE";
  if (tieneSerologia && tienePci) codigo = "COMPLETO";
  else if (serologias.length > 0 || donacion.pciDonaciones.length > 0) codigo = "EN_CARGA";

  return { codigo, etiqueta: ETIQUETA_ESTADO[codigo] };
}

function mapDonacion(donacion: DonacionConEstudios) {
  return {
    ...donacion,
    grupoFactor: donacion.persona?.grupoFactor ?? null,
    estadoEstudios: calcularEstadoEstudios(donacion),
  };
}

export async function listarDonaciones(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const search = firstValue(query.q);
  const personaId = firstValue(query.personaId);
  const dni = firstValue(query.dni);
  const rango = parseDateRange(query);

  const where: Prisma.DonacionDerWhereInput = {};
  if (personaId) where.idPersona = Number(personaId);
  if (dni) where.persona = { dni: normalizarDocumento(dni) };
  if (rango.gte || rango.lte) where.fecha = rango;
  if (search) {
    const documento = normalizarDocumento(search);
    where.OR = [
      { persona: { dni: { contains: documento } } },
      { persona: { nombre: { contains: search, mode: "insensitive" } } },
      { persona: { apellido: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.donacionDer.count({ where }),
    prisma.donacionDer.findMany({
      where,
      include: donacionInclude,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items.map(mapDonacion), meta: paginationMeta(page, limit, total) };
}

async function buscarDonacion(id: number) {
  const donacion = await prisma.donacionDer.findUnique({ where: { id }, include: donacionInclude });
  if (!donacion) throw notFound(`No existe la donación con id ${id}`);
  return donacion;
}

export async function obtenerDonacion(id: number) {
  return mapDonacion(await buscarDonacion(id));
}

async function resolverIdPersona(input: {
  idPersona?: number | null;
  persona?: CreateDonacionInput["persona"];
}): Promise<number | undefined> {
  if (input.idPersona) return input.idPersona;
  if (input.persona) {
    const persona = await resolverPersona(input.persona);
    return persona.id;
  }
  return undefined;
}

export async function crearDonacion(input: CreateDonacionInput) {
  const { persona, idGrupoFactor, ...data } = input;
  const idPersona = await resolverIdPersona({ idPersona: data.idPersona, persona });

  if (idPersona && idGrupoFactor) {
    await prisma.persona.update({ where: { id: idPersona }, data: { idGrupoFactor } });
  }

  const donacion = await prisma.donacionDer.create({
    data: { ...data, idPersona },
    include: donacionInclude,
  });
  return mapDonacion(donacion);
}

export async function actualizarDonacion(id: number, input: UpdateDonacionInput) {
  const donacion = await prisma.donacionDer.update({
    where: { id },
    data: input,
    include: donacionInclude,
  });
  return mapDonacion(donacion);
}

export async function eliminarDonacion(id: number) {
  await prisma.$transaction(async (tx) => {
    await tx.serologiaDonacionDer.deleteMany({ where: { idDonacion: id } });
    await tx.pciDonacionDer.deleteMany({ where: { idDonacion: id } });
    await tx.donacionDer.delete({ where: { id } });
  });
}

/**
 * Carga o actualiza los estudios de una donación.
 * Si ya existe una serología del mismo tipo o un PCI vinculado, lo reemplaza.
 */
export async function guardarEstudios(idDonacion: number, input: GuardarEstudiosInput) {
  await prisma.$transaction(async (tx) => {
    const donacion = await tx.donacionDer.findUnique({
      where: { id: idDonacion },
      include: {
        serologiaDonaciones: { include: { serologia: true } },
        pciDonaciones: { include: { pci: true } },
      },
    });
    if (!donacion) throw notFound(`No existe la donación con id ${idDonacion}`);

    for (const serologiaInput of input.serologias ?? []) {
      const vinculada = donacion.serologiaDonaciones.find(
        (item) => item.serologia.tipoMuestra === serologiaInput.tipoMuestra,
      );

      if (vinculada) {
        await tx.serologiaResultado.deleteMany({ where: { serologiaId: vinculada.idSerologia } });
        await tx.serologia.update({
          where: { id: vinculada.idSerologia },
          data: {
            fecha: serologiaInput.fecha,
            hora: horaADate(serologiaInput.hora),
            tipoMuestra: serologiaInput.tipoMuestra,
            operador: serologiaInput.operador,
            observaciones: serologiaInput.observaciones,
            resultados: serologiaInput.resultados.length
              ? {
                  create: serologiaInput.resultados.map((resultado) => ({
                    determinacionSerologicaId: resultado.determinacionSerologicaId,
                    resultado: resultado.resultado,
                    valor: resultado.valor,
                    unidad: resultado.unidad,
                    observacion: resultado.observacion,
                  })),
                }
              : undefined,
          },
        });
      } else {
        const serologia = await tx.serologia.create({
          data: {
            fecha: serologiaInput.fecha,
            hora: horaADate(serologiaInput.hora),
            tipoMuestra: serologiaInput.tipoMuestra,
            operador: serologiaInput.operador,
            observaciones: serologiaInput.observaciones,
            resultados: serologiaInput.resultados.length
              ? {
                  create: serologiaInput.resultados.map((resultado) => ({
                    determinacionSerologicaId: resultado.determinacionSerologicaId,
                    resultado: resultado.resultado,
                    valor: resultado.valor,
                    unidad: resultado.unidad,
                    observacion: resultado.observacion,
                  })),
                }
              : undefined,
          },
        });
        await tx.serologiaDonacionDer.create({
          data: { idSerologia: serologia.id, idDonacion },
        });
      }
    }

    if (input.pci) {
      const pciVinculado = donacion.pciDonaciones[0];
      if (pciVinculado) {
        await tx.pciResultado.deleteMany({ where: { pciId: pciVinculado.idPci } });
        await tx.pci.update({
          where: { id: pciVinculado.idPci },
          data: {
            fecha: input.pci.fecha,
            hora: horaADate(input.pci.hora),
            operador: input.pci.operador,
            observaciones: input.pci.observaciones,
            resultados: input.pci.resultados.length
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
      } else {
        const pci = await tx.pci.create({
          data: {
            fecha: input.pci.fecha,
            hora: horaADate(input.pci.hora),
            operador: input.pci.operador,
            observaciones: input.pci.observaciones,
            resultados: input.pci.resultados.length
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
        await tx.pciDonacionDer.create({ data: { idPci: pci.id, idDonacion } });
      }
    }
  });

  return estudiosDeDonacion(idDonacion);
}

/** Datos consolidados que consume la pantalla 14. */
export async function estudiosDeDonacion(id: number) {
  const donacion = await buscarDonacion(id);
  const serologias = donacion.serologiaDonaciones.map((item) => item.serologia);
  const pci = donacion.pciDonaciones.map((item) => item.pci);
  const estado = calcularEstadoEstudios(donacion);

  return {
    donacion: {
      id: donacion.id,
      fecha: donacion.fecha,
      operador: donacion.operador,
      voluntario: donacion.voluntario,
      reposicion: donacion.reposicion,
      autoexcluido: donacion.autoexcluido,
      observaciones: donacion.observaciones,
    },
    persona: donacion.persona,
    grupoFactor: donacion.persona?.grupoFactor ?? null,
    pci: pci[0] ?? null,
    pciEstudios: pci,
    serologiaPrimera: serologias.find((serologia) => serologia.tipoMuestra === "PRIMERA") ?? null,
    serologiaSegunda: serologias.find((serologia) => serologia.tipoMuestra === "SEGUNDA") ?? null,
    serologias,
    estado,
  };
}

/** Alta completa desde Posta Fija (pantalla 04) con estudios opcionales. */
export async function crearDonacionCompleta(input: DonacionCompletaInput) {
  let idPersona = input.idPersona ?? undefined;

  if (!idPersona && input.persona) {
    const persona = await resolverPersona(input.persona);
    idPersona = persona.id;
  }
  if (!idPersona) throw notFound("No se pudo resolver la persona de la donación");

  if (input.idGrupoFactor) {
    await prisma.persona.update({ where: { id: idPersona }, data: { idGrupoFactor: input.idGrupoFactor } });
  }

  const donacion = await prisma.donacionDer.create({
    data: { ...input.donacion, idPersona },
  });

  if (input.serologias?.length || input.pci) {
    await guardarEstudios(donacion.id, { serologias: input.serologias, pci: input.pci });
  }

  return estudiosDeDonacion(donacion.id);
}
