
import { prisma } from "../config/prisma";

import type {
  CrearEstudioPretransfusionalInput,
} from "../types/estudioPretransfusional.types";

// Tipos mínimos para trabajar con Prisma y facilitar los tests.

type SolicitudResumen = {
  id: number;
  pacienteId: number | null;
  estado: string;
  tipoHemocomponente: string;
};

type UnidadResumen = {
  id: number;
  numeroUnidad: string;
  solicitudId: number | null;
  tipoHemocomponente: string;
  estado?: string;
};

const ESTADOS_UNIDAD_NO_APTOS_ESTUDIO = new Set([
  "EMITIDA",
  "DADA_DE_BAJA",
  "VENCIDA",
  "BLOQUEADA",
]);

type EstudioGuardado = {
  tipo: string;
  compatibilidad: string | null;
  [key: string]: unknown;
};

export type EstudioPretransfusionalDb = {
  solicitudTransfusion: {
    findUnique(args: unknown): Promise<SolicitudResumen | null>;
  };
  unidadSangre: {
    findUnique(args: unknown): Promise<UnidadResumen | null>;
  };
  estudioPretransfusional: {
    create(args: unknown): Promise<EstudioGuardado>;
    findMany(args: unknown): Promise<EstudioGuardado[]>;
  };
};

const dbPredeterminada =
  prisma as unknown as EstudioPretransfusionalDb;

// Errores de negocio

export class SolicitudEstudioNoEncontradaError extends Error {
  constructor() {
    super("La solicitud de transfusión no existe.");
    this.name = "SolicitudEstudioNoEncontradaError";
  }
}

export class SolicitudEstudioSinPacienteError extends Error {
  constructor() {
    super("La solicitud no tiene un paciente asociado.");
    this.name = "SolicitudEstudioSinPacienteError";
  }
}

export class SolicitudEstudioCanceladaError extends Error {
  constructor() {
    super("No se pueden registrar estudios en una solicitud cancelada.");
    this.name = "SolicitudEstudioCanceladaError";
  }
}

export class UnidadEstudioNoEncontradaError extends Error {
  constructor() {
    super("La unidad de sangre no existe.");
    this.name = "UnidadEstudioNoEncontradaError";
  }
}

export class UnidadEstudioNoValidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "UnidadEstudioNoValidaError";
  }
}

// Busca una solicitud y comprueba que tenga paciente.

async function obtenerSolicitud(
  solicitudId: number,
  db: EstudioPretransfusionalDb,
) {
  const solicitud = await db.solicitudTransfusion.findUnique({
    where: { id: solicitudId },
    select: {
      id: true,
      pacienteId: true,
      estado: true,
      tipoHemocomponente: true,
    },
  });

  if (!solicitud) {
    throw new SolicitudEstudioNoEncontradaError();
  }

  if (solicitud.pacienteId === null) {
    throw new SolicitudEstudioSinPacienteError();
  }

  return solicitud;
}

// Genera una alerta cuando la prueba cruzada es incompatible.

function generarAlerta(estudio: EstudioGuardado): string | null {
  if (
    estudio.tipo === "PRUEBA_CRUZADA" &&
    estudio.compatibilidad === "INCOMPATIBLE"
  ) {
    return (
      "ALERTA: Se detectó incompatibilidad en la prueba cruzada. " +
      "La unidad requiere revisión y no debe considerarse apta " +
      "para esta transfusión."
    );
  }

  return null;
}

// Registra un estudio asociado a una solicitud.

export async function registrar(
  solicitudId: number,
  datos: CrearEstudioPretransfusionalInput,
  db: EstudioPretransfusionalDb = dbPredeterminada,
) {
  const solicitud = await obtenerSolicitud(solicitudId, db);

  if (solicitud.estado === "CANCELADA") {
    throw new SolicitudEstudioCanceladaError();
  }

  if (datos.tipo === "PRUEBA_CRUZADA") {
    if (!datos.unidadSangreId || !datos.compatibilidad) {
      throw new UnidadEstudioNoValidaError(
        "La prueba cruzada requiere unidad y compatibilidad.",
      );
    }

    const unidad = await db.unidadSangre.findUnique({
      where: { id: datos.unidadSangreId },
      select: {
        id: true,
        numeroUnidad: true,
        solicitudId: true,
        tipoHemocomponente: true,
        estado: true,
      },
    });

    if (!unidad) {
      throw new UnidadEstudioNoEncontradaError();
    }

    if (unidad.estado && ESTADOS_UNIDAD_NO_APTOS_ESTUDIO.has(unidad.estado)) {
      throw new UnidadEstudioNoValidaError(
        `La unidad está en estado ${unidad.estado} y no puede utilizarse para una prueba cruzada.`,
      );
    }

    if (
      unidad.solicitudId !== null &&
      unidad.solicitudId !== solicitud.id
    ) {
      throw new UnidadEstudioNoValidaError(
        "La unidad está asociada a otra solicitud.",
      );
    }

    if (
      unidad.tipoHemocomponente !== solicitud.tipoHemocomponente
    ) {
      throw new UnidadEstudioNoValidaError(
        "El hemocomponente no coincide con el solicitado.",
      );
    }
  } else if (
    datos.unidadSangreId !== undefined ||
    datos.compatibilidad !== undefined
  ) {
    throw new UnidadEstudioNoValidaError(
      "La unidad y la compatibilidad solo corresponden a pruebas cruzadas.",
    );
  }

  const estudio = await db.estudioPretransfusional.create({
    data: {
      solicitudId: solicitud.id,
      tipo: datos.tipo,
      resultado: datos.resultado,
      unidadSangreId: datos.unidadSangreId ?? null,
      compatibilidad: datos.compatibilidad ?? null,
      observaciones: datos.observaciones || null,
      operador: datos.operador,
    },
    include: {
      solicitud: {
        select: {
          id: true,
          pacienteId: true,
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              dni: true,
            },
          },
        },
      },
      unidadSangre: {
        select: {
          id: true,
          numeroUnidad: true,
        },
      },
    },
  });

  return {
    estudio,
    alerta: generarAlerta(estudio),
  };
}

// Consulta el historial de estudios de una solicitud.

export async function listarPorSolicitud(
  solicitudId: number,
  db: EstudioPretransfusionalDb = dbPredeterminada,
) {
  const solicitud = await obtenerSolicitud(solicitudId, db);

  const estudios = await db.estudioPretransfusional.findMany({
    where: {
      solicitudId: solicitud.id,
    },
    include: {
      unidadSangre: {
        select: {
          id: true,
          numeroUnidad: true,
        },
      },
    },
    orderBy: [
      { fechaHora: "desc" },
      { id: "desc" },
    ],
  });

  return {
    solicitudId: solicitud.id,
    pacienteId: solicitud.pacienteId,
    estudios: estudios.map((estudio) => ({
      ...estudio,
      alerta: generarAlerta(estudio),
    })),
  };
}
