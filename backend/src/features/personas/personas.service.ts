import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { notFound } from "../../lib/errors";
import { paginationMeta } from "../../lib/http";
import { firstValue, parsePositiveInt } from "../../lib/query";
import { calcularEdad, normalizarDocumento } from "../../utils/formato";
import type { CreatePersonaInput, GrupoFactorInput, UpdatePersonaInput } from "./personas.schema";

export type SemaforoEstado = "APTO" | "REVISAR" | "EXCLUIDO" | "SIN_ESTUDIOS";
export type SemaforoColor = "VERDE" | "AMARILLO" | "ROJO" | "GRIS";

export interface Semaforo {
  estado: SemaforoEstado;
  color: SemaforoColor;
  colorHex: string;
  motivo: string;
}

const COLOR_HEX: Record<SemaforoColor, string> = {
  VERDE: "#16A34A",
  AMARILLO: "#D97706",
  ROJO: "#DC2626",
  GRIS: "#6B7280",
};

const serologiaResumenSelect = {
  id: true,
  fecha: true,
  hora: true,
  tipoMuestra: true,
  resultados: { select: { resultado: true } },
} satisfies Prisma.SerologiaSelect;

type SerologiaResumen = Prisma.SerologiaGetPayload<{ select: typeof serologiaResumenSelect }>;

export const personaRelaciones = {
  direccion: { include: { ciudad: { include: { provincia: true } } } },
  grupoFactor: true,
  _count: {
    select: {
      donaciones: true,
      transfusiones: true,
      estudiosGestante: true,
      estudiosRnComoMadre: true,
      sangriasTerapeuticas: true,
    },
  },
} satisfies Prisma.PersonaInclude;

export function clasificarResultado(resultado: string): "REACTIVO" | "DUDOSO" | "NO_REACTIVO" | "OTRO" {
  const texto = resultado.trim().toLowerCase();
  if (/(no\s+reactivo|no\s+positivo|negativo|no\s+detectado)/.test(texto)) return "NO_REACTIVO";
  if (/(dudoso|indeterminado|borderline|l[ií]mite)/.test(texto)) return "DUDOSO";
  if (/(reactivo|positivo|detectado)/.test(texto)) return "REACTIVO";
  return "OTRO";
}

/**
 * Calcula el semáforo de aptitud de un donante a partir de sus serologías.
 * - Rojo: algún resultado reactivo/positivo histórico.
 * - Amarillo: serología dudosa sin segunda muestra negativa.
 * - Verde: estudios completos sin hallazgos.
 */
export function calcularSemaforo(serologias: SerologiaResumen[]): Semaforo {
  if (serologias.length === 0) {
    return {
      estado: "SIN_ESTUDIOS",
      color: "GRIS",
      colorHex: COLOR_HEX.GRIS,
      motivo: "No hay estudios serológicos registrados",
    };
  }

  const todasLasDeterminaciones = serologias.flatMap((serologia) =>
    serologia.resultados.map((resultado) => ({
      serologia,
      clasificacion: clasificarResultado(resultado.resultado),
    })),
  );

  const reactivo = todasLasDeterminaciones.find((item) => item.clasificacion === "REACTIVO");
  if (reactivo) {
    return {
      estado: "EXCLUIDO",
      color: "ROJO",
      colorHex: COLOR_HEX.ROJO,
      motivo: `Serología reactiva/positiva (estudio #${reactivo.serologia.id})`,
    };
  }

  const ordenadas = [...serologias].sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime() + new Date(a.hora).getTime();
    const fechaB = new Date(b.fecha).getTime() + new Date(b.hora).getTime();
    if (fechaA !== fechaB) return fechaA - fechaB;
    return (a.tipoMuestra === "SEGUNDA" ? 1 : 0) - (b.tipoMuestra === "SEGUNDA" ? 1 : 0);
  });

  const ultima = ordenadas[ordenadas.length - 1];
  const ultimaDudosa = ultima.resultados.some(
    (resultado) => clasificarResultado(resultado.resultado) === "DUDOSO",
  );
  if (ultimaDudosa) {
    return {
      estado: "REVISAR",
      color: "AMARILLO",
      colorHex: COLOR_HEX.AMARILLO,
      motivo: `Serología dudosa en el estudio #${ultima.id}; se requiere segunda muestra`,
    };
  }

  return {
    estado: "APTO",
    color: "VERDE",
    colorHex: COLOR_HEX.VERDE,
    motivo: "Estudios serológicos sin resultados reactivos",
  };
}

/** Obtiene los semáforos de varias personas en una sola consulta. */
async function semaforosPorPersona(ids: number[]): Promise<Map<number, Semaforo>> {
  const resultado = new Map<number, Semaforo>();
  if (ids.length === 0) return resultado;

  const donaciones = await prisma.donacionDer.findMany({
    where: { idPersona: { in: ids } },
    select: {
      idPersona: true,
      serologiaDonaciones: { select: { serologia: { select: serologiaResumenSelect } } },
    },
  });

  const agrupadas = new Map<number, SerologiaResumen[]>();
  for (const donacion of donaciones) {
    if (donacion.idPersona === null) continue;
    const lista = agrupadas.get(donacion.idPersona) ?? [];
    lista.push(...donacion.serologiaDonaciones.map((item) => item.serologia));
    agrupadas.set(donacion.idPersona, lista);
  }

  for (const id of ids) {
    resultado.set(id, calcularSemaforo(agrupadas.get(id) ?? []));
  }
  return resultado;
}

function resumenHistorial(persona: {
  _count?: {
    donaciones: number;
    transfusiones: number;
    estudiosGestante: number;
    estudiosRnComoMadre: number;
    sangriasTerapeuticas: number;
  };
}) {
  const counts = persona._count;
  return {
    donaciones: counts?.donaciones ?? 0,
    transfusiones: counts?.transfusiones ?? 0,
    estudiosGestante: counts?.estudiosGestante ?? 0,
    recienNacidos: counts?.estudiosRnComoMadre ?? 0,
    sangrias: counts?.sangriasTerapeuticas ?? 0,
  };
}

export async function listarPersonas(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 25, 200);
  const search = firstValue(query.q);
  const sexo = firstValue(query.sexoBiologico);
  const idGrupoFactor = firstValue(query.idGrupoFactor);

  const where: Prisma.PersonaWhereInput = {};
  if (search) {
    const documento = normalizarDocumento(search);
    where.OR = [
      { dni: { contains: documento } },
      { historiaClinica: { contains: search, mode: "insensitive" } },
      { nombre: { contains: search, mode: "insensitive" } },
      { apellido: { contains: search, mode: "insensitive" } },
    ];
  }
  if (sexo === "MASCULINO" || sexo === "FEMENINO") where.sexoBiologico = sexo;
  if (idGrupoFactor) where.idGrupoFactor = Number(idGrupoFactor);

  const [total, personas] = await Promise.all([
    prisma.persona.count({ where }),
    prisma.persona.findMany({
      where,
      include: personaRelaciones,
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const semaforos = await semaforosPorPersona(personas.map((persona) => persona.id));

  return {
    items: personas.map((persona) => ({
      ...persona,
      edad: calcularEdad(persona.fechaNacimiento),
      semaforo: semaforos.get(persona.id) ?? calcularSemaforo([]),
      resumen: resumenHistorial(persona),
    })),
    meta: paginationMeta(page, limit, total),
  };
}

/** Búsqueda unificada usada por la pantalla 02. */
export async function buscarPersonas(termino: string) {
  const busqueda = termino.trim();
  if (!busqueda) return [];
  const documento = normalizarDocumento(busqueda);

  const personas = await prisma.persona.findMany({
    where: {
      OR: [
        { dni: { contains: documento } },
        { historiaClinica: { contains: busqueda, mode: "insensitive" } },
        { nombre: { contains: busqueda, mode: "insensitive" } },
        { apellido: { contains: busqueda, mode: "insensitive" } },
      ],
    },
    include: personaRelaciones,
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    take: 20,
  });

  const semaforos = await semaforosPorPersona(personas.map((persona) => persona.id));

  return personas.map((persona) => ({
    id: persona.id,
    dni: persona.dni,
    historiaClinica: persona.historiaClinica,
    nombre: persona.nombre,
    apellido: persona.apellido,
    telefono: persona.telefono,
    fechaNacimiento: persona.fechaNacimiento,
    edad: calcularEdad(persona.fechaNacimiento),
    grupoFactor: persona.grupoFactor,
    direccion: persona.direccion,
    semaforo: semaforos.get(persona.id) ?? calcularSemaforo([]),
    resumen: resumenHistorial(persona),
  }));
}

export async function buscarPorDni(dni: string) {
  const persona = await prisma.persona.findFirst({
    where: { dni: normalizarDocumento(dni) },
    include: personaRelaciones,
  });
  if (!persona) return null;
  const semaforos = await semaforosPorPersona([persona.id]);
  return {
    ...persona,
    edad: calcularEdad(persona.fechaNacimiento),
    semaforo: semaforos.get(persona.id) ?? calcularSemaforo([]),
    resumen: resumenHistorial(persona),
  };
}

export async function obtenerPersona(id: number) {
  const persona = await prisma.persona.findUnique({ where: { id }, include: personaRelaciones });
  if (!persona) throw notFound(`No existe la persona con id ${id}`);
  const semaforos = await semaforosPorPersona([persona.id]);
  return {
    ...persona,
    edad: calcularEdad(persona.fechaNacimiento),
    semaforo: semaforos.get(persona.id) ?? calcularSemaforo([]),
    resumen: resumenHistorial(persona),
  };
}

/** Busca por DNI y actualiza, o crea la persona si no existe. */
export async function resolverPersona(input: CreatePersonaInput) {
  const existente = await prisma.persona.findFirst({ where: { dni: input.dni } });
  if (existente) {
    return prisma.persona.update({ where: { id: existente.id }, data: input });
  }
  return prisma.persona.create({ data: input });
}

export async function crearPersona(input: CreatePersonaInput) {
  const persona = await prisma.persona.create({
    data: input,
    include: personaRelaciones,
  });
  return {
    ...persona,
    edad: calcularEdad(persona.fechaNacimiento),
    semaforo: calcularSemaforo([]),
    resumen: resumenHistorial(persona),
  };
}

export async function actualizarPersona(id: number, input: UpdatePersonaInput) {
  const persona = await prisma.persona.update({
    where: { id },
    data: input,
    include: personaRelaciones,
  });
  const semaforos = await semaforosPorPersona([persona.id]);
  return {
    ...persona,
    edad: calcularEdad(persona.fechaNacimiento),
    semaforo: semaforos.get(persona.id) ?? calcularSemaforo([]),
    resumen: resumenHistorial(persona),
  };
}

export async function eliminarPersona(id: number) {
  await prisma.persona.delete({ where: { id } });
}

export async function asignarGrupoFactor(id: number, input: GrupoFactorInput) {
  let idGrupoFactor = input.idGrupoFactor ?? undefined;

  if (idGrupoFactor === undefined) {
    const existente = await prisma.gyf.findFirst({
      where: { grupo: input.grupo ?? null, factor: input.factor ?? null },
    });
    const gyf = existente ?? (await prisma.gyf.create({ data: { grupo: input.grupo, factor: input.factor } }));
    idGrupoFactor = gyf.id;
  }

  return actualizarPersona(id, { idGrupoFactor });
}

/** Historial completo: donaciones, transfusiones, gestante/RN y sangrías. */
export async function obtenerHistorial(id: number) {
  const persona = await prisma.persona.findUnique({
    where: { id },
    include: {
      ...personaRelaciones,
      donaciones: {
        orderBy: [{ fecha: "desc" }],
        include: {
          serologiaDonaciones: {
            include: {
              serologia: {
                include: {
                  resultados: { include: { determinacionSerologica: true } },
                },
              },
            },
          },
          pciDonaciones: {
            include: { pci: { include: { resultados: { include: { antigeno: true } } } } },
          },
        },
      },
      transfusiones: {
        orderBy: [{ fecha: "desc" }],
        include: { fenotipo1: true, fenotipo2: true, grupoFactor: true, tipoTransfusion: true },
      },
      estudiosGestante: {
        orderBy: [{ fecha: "desc" }],
        include: {
          pciAsociados: {
            include: { pci: { include: { resultados: { include: { antigeno: true } } } } },
          },
        },
      },
      estudiosRnComoMadre: {
        orderBy: [{ fecha: "desc" }],
        include: {
          grupoFactor: true,
          pcd: { include: { resultados: { include: { determinacionPcd: true } } } },
          pci: { include: { resultados: { include: { antigeno: true } } } },
        },
      },
      sangriasTerapeuticas: {
        orderBy: [{ fecha: "desc" }],
        include: { obraSocial: true, medico: true },
      },
    },
  });

  if (!persona) throw notFound(`No existe la persona con id ${id}`);

  const serologias = persona.donaciones.flatMap((donacion) =>
    donacion.serologiaDonaciones.map((item) => item.serologia),
  );

  return {
    persona: {
      id: persona.id,
      dni: persona.dni,
      historiaClinica: persona.historiaClinica,
      nombre: persona.nombre,
      apellido: persona.apellido,
      telefono: persona.telefono,
      fechaNacimiento: persona.fechaNacimiento,
      edad: calcularEdad(persona.fechaNacimiento),
      lugarNacimiento: persona.lugarNacimiento,
      sexoBiologico: persona.sexoBiologico,
      direccion: persona.direccion,
      grupoFactor: persona.grupoFactor,
    },
    semaforo: calcularSemaforo(serologias),
    resumen: resumenHistorial(persona),
    donaciones: persona.donaciones,
    transfusiones: persona.transfusiones,
    estudiosGestante: persona.estudiosGestante,
    estudiosRecienNacido: persona.estudiosRnComoMadre,
    sangriasTerapeuticas: persona.sangriasTerapeuticas,
  };
}

export async function semaforoDePersona(id: number) {
  const exists = await prisma.persona.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound(`No existe la persona con id ${id}`);
  const semaforos = await semaforosPorPersona([id]);
  return semaforos.get(id) ?? calcularSemaforo([]);
}

/** Donantes con serología dudosa que aún no tienen segunda muestra resuelta. */
export async function donantesEnRevision() {
  const donaciones = await prisma.donacionDer.findMany({
    where: { serologiaDonaciones: { some: {} } },
    include: {
      persona: { include: personaRelaciones },
      serologiaDonaciones: {
        include: {
          serologia: { include: { resultados: { include: { determinacionSerologica: true } } } },
        },
      },
    },
    orderBy: [{ fecha: "desc" }],
  });

  const enRevision = donaciones.filter((donacion) => {
    const serologias = donacion.serologiaDonaciones.map((item) => item.serologia);
    const hayDudosa = serologias.some((serologia) =>
      serologia.resultados.some((resultado) => clasificarResultado(resultado.resultado) === "DUDOSO"),
    );
    const haySegunda = serologias.some(
      (serologia) => serologia.tipoMuestra === "SEGUNDA" && serologia.resultados.length > 0,
    );
    return hayDudosa && !haySegunda;
  });

  return enRevision.map((donacion) => ({
    donacion: {
      id: donacion.id,
      fecha: donacion.fecha,
      idPersona: donacion.idPersona,
      observaciones: donacion.observaciones,
    },
    persona: donacion.persona,
    semaforo: calcularSemaforo(
      donacion.serologiaDonaciones.map((item) => item.serologia),
    ),
    serologias: donacion.serologiaDonaciones.map((item) => item.serologia),
  }));
}

export { semaforosPorPersona };
