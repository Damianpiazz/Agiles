import { prisma } from "../config/prisma";
import type { EmitirUnidadInput } from "../types/emisionUnidad.types";
import { esUnidadCompatible } from "./seleccionComponente.service";

export class SolicitudEmisionNoEncontradaError extends Error {
  constructor() {
    super("La solicitud de transfusión no existe.");
    this.name = "SolicitudEmisionNoEncontradaError";
  }
}

export class UnidadEmisionNoEncontradaError extends Error {
  constructor() {
    super("La unidad de sangre no existe.");
    this.name = "UnidadEmisionNoEncontradaError";
  }
}

export class SolicitudSinPacienteParaEmisionError extends Error {
  constructor() {
    super("La solicitud no tiene un paciente asociado y no puede emitir unidades.");
    this.name = "SolicitudSinPacienteParaEmisionError";
  }
}

export class SolicitudNoAprobadaParaEmisionError extends Error {
  constructor(estado: string) {
    super(
      estado === "CANCELADA"
        ? "La solicitud está cancelada y no puede emitir unidades."
        : `La solicitud está en estado ${estado} y debe estar APROBADA para emitir unidades.`,
    );
    this.name = "SolicitudNoAprobadaParaEmisionError";
  }
}

export class UnidadNoReservadaParaEmisionError extends Error {
  constructor(mensaje?: string) {
    super(
      mensaje ??
        "La unidad no está en estado RESERVADA y no puede emitirse.",
    );
    this.name = "UnidadNoReservadaParaEmisionError";
  }
}

export class UnidadNoPerteneceASolicitudError extends Error {
  constructor() {
    super("La unidad está reservada para otra solicitud de transfusión.");
    this.name = "UnidadNoPerteneceASolicitudError";
  }
}

export class UnidadVencidaParaEmisionError extends Error {
  constructor() {
    super("La unidad está vencida y no puede emitirse.");
    this.name = "UnidadVencidaParaEmisionError";
  }
}

export class UnidadIncompatibleParaEmisionError extends Error {
  constructor() {
    super(
      "La unidad no es compatible por tipo de componente o grupo ABO/Rh(D) con el receptor.",
    );
    this.name = "UnidadIncompatibleParaEmisionError";
  }
}

export class PruebaCruzadaIncompatibleError extends Error {
  constructor() {
    super(
      "La última prueba cruzada registrada para esta unidad y solicitud es INCOMPATIBLE; la emisión está bloqueada.",
    );
    this.name = "PruebaCruzadaIncompatibleError";
  }
}

export type EmisionDb = {
  solicitudTransfusion: {
    findUnique(args: unknown): Promise<any>;
  };
  unidadSangre: {
    findUnique(args: unknown): Promise<any>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  estudioPretransfusional: {
    findFirst(args: unknown): Promise<any>;
  };
  emisionUnidad: {
    create(args: unknown): Promise<any>;
    findMany(args: unknown): Promise<any[]>;
  };
};

type EmisionDbRoot = EmisionDb & {
  $transaction<T>(callback: (tx: EmisionDb) => Promise<T>): Promise<T>;
};

const dbPredeterminada = prisma as unknown as EmisionDbRoot;

const LEYENDA_EMERGENCIA_SIN_PRUEBA =
  "Prueba de compatibilidad no completada al momento de la liberación";

export type EtiquetaTransfusion = {
  receptor: {
    nombre: string;
    dni: string;
    grupoABO: string;
    factorRhD: string;
  };
  unidad: {
    numeroUnidad: string;
    tipoHemocomponente: string;
    grupoABO: string;
    factorRhD: string;
    fechaVencimiento: Date;
  };
  requisitosEspeciales: string | null;
  interpretacionCompatibilidad: string;
  compatibilidadCompleta: boolean;
  caracter: string | null;
  fechaHoraSalida: Date;
  responsable: string;
};

function inicioHoyUtc(): Date {
  const ahora = new Date();
  return new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()),
  );
}

function construirRequisitosEspeciales(solicitud: {
  irradiado?: boolean;
  lavado?: boolean;
  desleucocitado?: boolean;
  fraccionadoPediatrico?: boolean;
}): string | null {
  const lista: string[] = [];
  if (solicitud.irradiado) lista.push("Irradiado");
  if (solicitud.lavado) lista.push("Lavado");
  if (solicitud.desleucocitado) lista.push("Desleucocitado");
  if (solicitud.fraccionadoPediatrico) lista.push("Fraccionado pediátrico");
  return lista.length > 0 ? lista.join(", ") : null;
}

export function construirEtiqueta(emision: {
  nombrePaciente: string;
  dniPaciente: string;
  grupoABOReceptor: string;
  factorRhDReceptor: string;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABOUnidad: string;
  factorRhDUnidad: string;
  fechaVencimientoUnidad: Date;
  requisitosEspeciales: string | null;
  resultadoCompatibilidad: string | null;
  compatibilidadCompleta: boolean;
  caracter: string | null;
  fechaHora: Date;
  responsable: string;
}): EtiquetaTransfusion {
  let interpretacionCompatibilidad: string;
  if (emision.resultadoCompatibilidad === "COMPATIBLE") {
    interpretacionCompatibilidad = "Prueba cruzada compatible";
  } else if (emision.caracter === "EMERGENCIA") {
    interpretacionCompatibilidad = `${LEYENDA_EMERGENCIA_SIN_PRUEBA} (EMERGENCIA)`;
  } else {
    interpretacionCompatibilidad = "Sin prueba cruzada registrada";
  }

  return {
    receptor: {
      nombre: emision.nombrePaciente,
      dni: emision.dniPaciente,
      grupoABO: emision.grupoABOReceptor,
      factorRhD: emision.factorRhDReceptor,
    },
    unidad: {
      numeroUnidad: emision.numeroUnidad,
      tipoHemocomponente: emision.tipoHemocomponente,
      grupoABO: emision.grupoABOUnidad,
      factorRhD: emision.factorRhDUnidad,
      fechaVencimiento: emision.fechaVencimientoUnidad,
    },
    requisitosEspeciales: emision.requisitosEspeciales,
    interpretacionCompatibilidad,
    compatibilidadCompleta: emision.compatibilidadCompleta,
    caracter: emision.caracter,
    fechaHoraSalida: emision.fechaHora,
    responsable: emision.responsable,
  };
}

export async function emitir(
  solicitudId: number,
  unidadId: number,
  datos: EmitirUnidadInput,
  db: EmisionDbRoot = dbPredeterminada,
) {
  return db.$transaction(async (tx) => {
    const solicitud = await tx.solicitudTransfusion.findUnique({
      where: { id: solicitudId },
    });
    if (!solicitud) {
      throw new SolicitudEmisionNoEncontradaError();
    }
    if (solicitud.estado !== "APROBADA") {
      throw new SolicitudNoAprobadaParaEmisionError(solicitud.estado);
    }
    if (solicitud.pacienteId === null || solicitud.pacienteId === undefined) {
      throw new SolicitudSinPacienteParaEmisionError();
    }

    const unidad = await tx.unidadSangre.findUnique({
      where: { id: unidadId },
    });
    if (!unidad) {
      throw new UnidadEmisionNoEncontradaError();
    }
    if (unidad.estado !== "RESERVADA") {
      throw new UnidadNoReservadaParaEmisionError(
        `La unidad está en estado ${unidad.estado} y debe estar RESERVADA para emitirse.`,
      );
    }
    if (unidad.solicitudId !== solicitudId) {
      throw new UnidadNoPerteneceASolicitudError();
    }
    if (new Date(unidad.fechaVencimiento).getTime() < inicioHoyUtc().getTime()) {
      throw new UnidadVencidaParaEmisionError();
    }
    if (
      unidad.tipoHemocomponente !== solicitud.tipoHemocomponente ||
      !esUnidadCompatible(unidad, solicitud)
    ) {
      throw new UnidadIncompatibleParaEmisionError();
    }

    const ultimaPruebaCruzada = await tx.estudioPretransfusional.findFirst({
      where: {
        solicitudId,
        unidadSangreId: unidadId,
        tipo: "PRUEBA_CRUZADA",
      },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    });

    if (ultimaPruebaCruzada?.compatibilidad === "INCOMPATIBLE") {
      throw new PruebaCruzadaIncompatibleError();
    }

    const resultadoCompatibilidad =
      ultimaPruebaCruzada?.compatibilidad ?? null;
    const compatibilidadCompleta = resultadoCompatibilidad === "COMPATIBLE";
    const advertencias: string[] = [];

    if (!compatibilidadCompleta) {
      if (solicitud.caracter === "EMERGENCIA") {
        advertencias.push(
          `${LEYENDA_EMERGENCIA_SIN_PRUEBA} (emisión en carácter de EMERGENCIA).`,
        );
      } else {
        advertencias.push(
          "No hay prueba cruzada registrada para esta unidad.",
        );
      }
    }

    const actualizacion = await tx.unidadSangre.updateMany({
      where: { id: unidadId, estado: "RESERVADA", solicitudId },
      data: { estado: "EMITIDA" },
    });
    if (actualizacion.count === 0) {
      throw new UnidadNoReservadaParaEmisionError(
        "La unidad ya fue emitida o dejó de estar reservada para esta solicitud.",
      );
    }

    const emision = await tx.emisionUnidad.create({
      data: {
        unidadSangreId: unidadId,
        solicitudId,
        pacienteId: solicitud.pacienteId,
        dniPaciente: solicitud.dniPaciente,
        nombrePaciente: solicitud.nombrePaciente,
        grupoABOReceptor: solicitud.grupoABO,
        factorRhDReceptor: solicitud.factorRhD,
        numeroUnidad: unidad.numeroUnidad,
        tipoHemocomponente: unidad.tipoHemocomponente,
        grupoABOUnidad: unidad.grupoABO,
        factorRhDUnidad: unidad.factorRhD,
        fechaVencimientoUnidad: unidad.fechaVencimiento,
        caracter: solicitud.caracter ?? null,
        requisitosEspeciales: construirRequisitosEspeciales(solicitud),
        resultadoCompatibilidad,
        compatibilidadCompleta,
        responsable: datos.responsable,
        observaciones: datos.observaciones ?? null,
      },
    });

    const unidadActualizada = await tx.unidadSangre.findUnique({
      where: { id: unidadId },
    });

    return {
      emision,
      unidad: unidadActualizada,
      etiqueta: construirEtiqueta(emision),
      advertencias,
    };
  });
}

export async function listar(db: EmisionDb = dbPredeterminada) {
  const emisiones = await db.emisionUnidad.findMany({
    include: {
      solicitud: {
        select: {
          id: true,
          estado: true,
          fechaHora: true,
        },
      },
      unidadSangre: {
        select: {
          id: true,
          estado: true,
        },
      },
    },
    orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
  });

  return emisiones.map((emision) => ({
    ...emision,
    etiqueta: construirEtiqueta(emision),
  }));
}

export async function listarPorUnidad(
  unidadId: number,
  db: EmisionDb = dbPredeterminada,
) {
  const unidad = await db.unidadSangre.findUnique({
    where: { id: unidadId },
  });
  if (!unidad) {
    throw new UnidadEmisionNoEncontradaError();
  }

  const emisiones = await db.emisionUnidad.findMany({
    where: { unidadSangreId: unidadId },
    orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
  });

  return {
    unidad,
    emisiones: emisiones.map((emision) => ({
      ...emision,
      etiqueta: construirEtiqueta(emision),
    })),
  };
}

export async function listarPorSolicitud(
  solicitudId: number,
  db: EmisionDb = dbPredeterminada,
) {
  const solicitud = await db.solicitudTransfusion.findUnique({
    where: { id: solicitudId },
  });
  if (!solicitud) {
    throw new SolicitudEmisionNoEncontradaError();
  }

  const emisiones = await db.emisionUnidad.findMany({
    where: { solicitudId },
    orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
  });

  return {
    solicitud,
    emisiones: emisiones.map((emision) => ({
      ...emision,
      etiqueta: construirEtiqueta(emision),
    })),
  };
}
