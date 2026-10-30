import { prisma } from "../config/prisma";

export class SolicitudNoEncontradaError extends Error {
  constructor() {
    super("La solicitud de transfusión no existe.");
    this.name = "SolicitudNoEncontradaError";
  }
}

export class SolicitudNoAprobadaError extends Error {
  constructor() {
    super(
      "La solicitud de transfusión no está aprobada: solo se pueden preparar componentes de solicitudes aprobadas.",
    );
    this.name = "SolicitudNoAprobadaError";
  }
}

export class UnidadNoEncontradaError extends Error {
  constructor() {
    super("La unidad de sangre no existe.");
    this.name = "UnidadNoEncontradaError";
  }
}

export class UnidadNoDisponibleError extends Error {
  constructor(motivo = "La unidad no está disponible para preparar.") {
    super(motivo);
    this.name = "UnidadNoDisponibleError";
  }
}

export class UnidadNoCompatibleError extends Error {
  constructor() {
    super("La unidad seleccionada no es compatible con el receptor de la solicitud.");
    this.name = "UnidadNoCompatibleError";
  }
}

type SolicitudTransfusionDb = {
  findUnique: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any>;
};

type UnidadSangreDb = {
  findUnique: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any>;
  updateMany: (args: any) => Promise<{ count: number }>;
};

type SeleccionComponenteDb = {
  solicitudTransfusion: SolicitudTransfusionDb;
  unidadSangre: UnidadSangreDb;
};

const dbPredeterminada = prisma as unknown as SeleccionComponenteDb;

/**
 * Grupos ABO del donante compatibles con cada grupo ABO del receptor.
 * Regla utilizada para glóbulos rojos y plasma: el componente del donante
 * no debe contener antígenos/anticuerpos incompatibles con el receptor.
 */
const gruposDonantesCompatibles: Record<string, string[]> = {
  O: ["O"],
  A: ["A", "O"],
  B: ["B", "O"],
  AB: ["AB", "A", "B", "O"],
};

type Receptor = {
  grupoABO: string;
  factorRhD: string;
};

type Unidad = {
  tipoHemocomponente: string;
  grupoABO: string;
  factorRhD: string;
  estado: string;
  fechaVencimiento: Date;
};

function fechaHoy(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export function esUnidadCompatible(unidad: Unidad, receptor: Receptor): boolean {
  const gruposAceptados = gruposDonantesCompatibles[receptor.grupoABO] ?? [];

  if (!gruposAceptados.includes(unidad.grupoABO)) {
    return false;
  }

  if (receptor.factorRhD === "NEGATIVO" && unidad.factorRhD !== "NEGATIVO") {
    return false;
  }

  return true;
}

function estaDisponibleParaPreparar(unidad: Unidad): boolean {
  return (
    unidad.estado === "DISPONIBLE" &&
    unidad.fechaVencimiento.getTime() >= fechaHoy().getTime()
  );
}

function construirRespuestaUnidad(unidad: any) {
  return {
    ...unidad,
    vencida: unidad.fechaVencimiento.getTime() < fechaHoy().getTime(),
  };
}

export async function listarSolicitudes(
  estado?: string,
  db: SeleccionComponenteDb = dbPredeterminada,
) {
  const solicitudes = await db.solicitudTransfusion.findMany({
    where: estado ? { estado } : undefined,
    orderBy: { fechaHora: "desc" },
  });

  return solicitudes;
}

export async function listarUnidadesCompatibles(
  solicitudId: number,
  db: SeleccionComponenteDb = dbPredeterminada,
) {
  const solicitud = await db.solicitudTransfusion.findUnique({
    where: { id: solicitudId },
  });

  if (!solicitud) {
    throw new SolicitudNoEncontradaError();
  }

  if (solicitud.estado !== "APROBADA") {
    throw new SolicitudNoAprobadaError();
  }

  const unidades = await db.unidadSangre.findMany({
    where: {
      tipoHemocomponente: solicitud.tipoHemocomponente,
      estado: "DISPONIBLE",
      fechaVencimiento: { gte: fechaHoy() },
    },
    orderBy: { fechaVencimiento: "asc" },
  });

  const compatibles = unidades
    .filter((unidad: Unidad) => estaDisponibleParaPreparar(unidad))
    .filter((unidad: Unidad) => esUnidadCompatible(unidad, solicitud))
    .map(construirRespuestaUnidad);

  const sinUnidadesDisponibles = compatibles.length === 0;

  return {
    solicitud,
    unidades: compatibles,
    sinUnidadesDisponibles,
    mensaje: sinUnidadesDisponibles
      ? "No hay unidades compatibles disponibles para esta solicitud. Verificá el inventario o registrá la recepción de nuevas unidades."
      : `Se encontraron ${compatibles.length} unidad(es) compatible(s) disponible(s) para preparar.`,
  };
}

export async function reservarUnidad(
  solicitudId: number,
  unidadId: number,
  operador: string,
  db: SeleccionComponenteDb = dbPredeterminada,
) {
  const solicitud = await db.solicitudTransfusion.findUnique({
    where: { id: solicitudId },
  });

  if (!solicitud) {
    throw new SolicitudNoEncontradaError();
  }

  if (solicitud.estado !== "APROBADA") {
    throw new SolicitudNoAprobadaError();
  }

  const unidad = await db.unidadSangre.findUnique({
    where: { id: unidadId },
  });

  if (!unidad) {
    throw new UnidadNoEncontradaError();
  }

  if (unidad.tipoHemocomponente !== solicitud.tipoHemocomponente) {
    throw new UnidadNoCompatibleError();
  }

  if (!esUnidadCompatible(unidad, solicitud)) {
    throw new UnidadNoCompatibleError();
  }

  if (!estaDisponibleParaPreparar(unidad)) {
    throw new UnidadNoDisponibleError(
      unidad.estado === "DISPONIBLE"
        ? "La unidad está vencida y no puede prepararse."
        : "La unidad no está disponible para preparar.",
    );
  }

  // Reserva atómica: solo si sigue DISPONIBLE, evita preparaciones simultáneas.
  const resultado = await db.unidadSangre.updateMany({
    where: { id: unidadId, estado: "DISPONIBLE" },
    data: {
      estado: "RESERVADA",
      solicitudId: solicitud.id,
      reservadaPor: operador,
      reservadaEn: new Date(),
    },
  });

  if (resultado.count === 0) {
    throw new UnidadNoDisponibleError(
      "La unidad ya fue preparada o dejó de estar disponible.",
    );
  }

  const unidadReservada = await db.unidadSangre.findUnique({
    where: { id: unidadId },
  });

  return {
    mensaje: `Unidad ${unidad.numeroUnidad} reservada para ${solicitud.nombrePaciente} (DNI ${solicitud.dniPaciente}).`,
    unidad: construirRespuestaUnidad(unidadReservada),
  };
}
