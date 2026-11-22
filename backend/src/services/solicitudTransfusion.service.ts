import { prisma } from "../config/prisma";
import type {
  ActualizarSolicitudTransfusionInput,
  CancelarSolicitudTransfusionInput,
  CrearSolicitudTransfusionInput,
  ListarSolicitudesTransfusionInput,
} from "../types/solicitudTransfusion.types";

type PacienteSnapshot = { id: number; nombre: string; apellido: string; dni: string };
type SolicitudDb = {
  paciente: {
    findUnique(args: unknown): Promise<PacienteSnapshot | null>;
  };
  solicitudTransfusion: {
    create(args: unknown): Promise<any>;
    findMany(args: unknown): Promise<any[]>;
    findUnique(args: unknown): Promise<any>;
    update(args: unknown): Promise<any>;
  };
  solicitudTransfusionAuditoria: {
    create(args: unknown): Promise<unknown>;
    createMany(args: unknown): Promise<{ count: number }>;
  };
  unidadSangre: {
    count(args: unknown): Promise<number>;
  };
};
type SolicitudDbTx = SolicitudDb;
type SolicitudDbRoot = SolicitudDb & {
  $transaction<T>(callback: (tx: SolicitudDbTx) => Promise<T>): Promise<T>;
};

const dbPredeterminada = prisma as unknown as SolicitudDbRoot;
const includePaciente = { paciente: true } as const;
const includeListado = {
  paciente: true,
  auditoria: { orderBy: { fechaHora: "desc" } },
} as const;
const includeDetalle = {
  paciente: true,
  auditoria: { orderBy: { fechaHora: "desc" } },
  unidades: { orderBy: { numeroUnidad: "asc" } },
} as const;

export class PacienteSolicitudNoEncontradoError extends Error {
  constructor() {
    super("El paciente seleccionado no existe.");
    this.name = "PacienteSolicitudNoEncontradoError";
  }
}

export class SolicitudTransfusionNoEncontradaError extends Error {
  constructor() {
    super("La solicitud de transfusión no existe.");
    this.name = "SolicitudTransfusionNoEncontradaError";
  }
}

export class SolicitudTransfusionCanceladaError extends Error {
  constructor() {
    super("La solicitud está cancelada y no puede modificarse.");
    this.name = "SolicitudTransfusionCanceladaError";
  }
}

export class SolicitudTransfusionConUnidadesError extends Error {
  constructor() {
    super("La solicitud tiene unidades reservadas y no puede modificarse ni cancelarse.");
    this.name = "SolicitudTransfusionConUnidadesError";
  }
}

export class SolicitudTransfusionSinCambiosError extends Error {
  constructor() {
    super("No se detectaron cambios para guardar.");
    this.name = "SolicitudTransfusionSinCambiosError";
  }
}

function serializar(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

function mapearDatos(
  datos: CrearSolicitudTransfusionInput | ActualizarSolicitudTransfusionInput,
  paciente: PacienteSnapshot,
) {
  return {
    pacienteId: paciente.id,
    dniPaciente: paciente.dni,
    nombrePaciente: `${paciente.nombre} ${paciente.apellido}`,
    grupoABO: datos.grupoABO,
    factorRhD: datos.factorRhD,
    tipoHemocomponente: datos.tipoHemocomponente,
    cantidad: datos.cantidad,
    observaciones: datos.observaciones || null,
    fechaHora: datos.fechaHoraPedido,
    modalidad: datos.modalidad,
    servicioSolicitante:
      datos.modalidad === "INTERNACION" ? datos.servicioSolicitante || null : null,
    sala: datos.modalidad === "INTERNACION" ? datos.sala || null : null,
    cama: datos.modalidad === "INTERNACION" ? datos.cama || null : null,
    piso: datos.modalidad === "INTERNACION" ? datos.piso || null : null,
    sector: datos.modalidad === "INTERNACION" ? datos.sector || null : null,
    unidadRealizacion:
      datos.modalidad === "AMBULATORIA" ? datos.unidadRealizacion || null : null,
    servicioDerivante:
      datos.modalidad === "AMBULATORIA" ? datos.servicioDerivante || null : null,
    domicilioRealizacion:
      datos.modalidad === "DOMICILIARIA" ? datos.domicilioRealizacion || null : null,
    localidadReferencia:
      datos.modalidad === "DOMICILIARIA" ? datos.localidadReferencia || null : null,
    diagnosticoBase: datos.diagnosticoBase,
    diagnosticoIndicacion: datos.diagnosticoIndicacion,
    antecedenteTransfusional: datos.antecedenteTransfusional,
    reaccionTransfusionalPrev: datos.reaccionTransfusionalPrev,
    sensibilizacionObstetrica: datos.sensibilizacionObstetrica,
    hematocrito: datos.hematocrito,
    hemoglobina: datos.hemoglobina,
    plaquetas: datos.plaquetas,
    fechaHoraLaboratorio: datos.fechaHoraLaboratorio,
    volumenMl: datos.volumenMl ?? null,
    irradiado: datos.irradiado,
    lavado: datos.lavado,
    desleucocitado: datos.desleucocitado,
    fraccionadoPediatrico: datos.fraccionadoPediatrico,
    caracter: datos.caracter,
    medicoPrescriptor: datos.medicoPrescriptor,
    firmaAclarada: datos.firmaAclarada,
    matriculaPrescriptor: datos.matriculaPrescriptor,
  };
}

export async function listar(
  filtros: ListarSolicitudesTransfusionInput,
  db: SolicitudDb = dbPredeterminada,
) {
  return db.solicitudTransfusion.findMany({
    where: {
      ...(filtros.estado ? { estado: filtros.estado } : {}),
      ...(filtros.pacienteId ? { pacienteId: filtros.pacienteId } : {}),
    },
    include: includeListado,
    orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
  });
}

export async function buscarPorId(
  id: number,
  db: SolicitudDb = dbPredeterminada,
) {
  return db.solicitudTransfusion.findUnique({
    where: { id },
    include: includeDetalle,
  });
}

export async function crear(
  datos: CrearSolicitudTransfusionInput,
  db: SolicitudDbRoot = dbPredeterminada,
) {
  return db.$transaction(async (tx) => {
    const paciente = await tx.paciente.findUnique({
      where: { id: datos.pacienteId },
      select: { id: true, nombre: true, apellido: true, dni: true },
    });
    if (!paciente) throw new PacienteSolicitudNoEncontradoError();

    const data = {
      ...mapearDatos(datos, paciente),
      operador: datos.operador,
      fechaHoraRecepcion: new Date(),
    };
    const solicitud = await tx.solicitudTransfusion.create({
      data,
      include: includePaciente,
    });

    await tx.solicitudTransfusionAuditoria.create({
      data: {
        solicitudId: solicitud.id,
        accion: "CREACION",
        datoModificado: "solicitud",
        valorAnterior: null,
        valorNuevo: serializar(data),
        operador: datos.operador,
      },
    });

    return solicitud;
  });
}

export async function actualizar(
  id: number,
  datos: ActualizarSolicitudTransfusionInput,
  db: SolicitudDbRoot = dbPredeterminada,
) {
  return db.$transaction(async (tx) => {
    const actual = await tx.solicitudTransfusion.findUnique({
      where: { id },
      include: { unidades: { where: { estado: "RESERVADA" }, select: { id: true } } },
    });
    if (!actual) throw new SolicitudTransfusionNoEncontradaError();
    if (actual.estado === "CANCELADA") throw new SolicitudTransfusionCanceladaError();
    if (actual.unidades.length > 0) throw new SolicitudTransfusionConUnidadesError();

    const paciente = await tx.paciente.findUnique({
      where: { id: datos.pacienteId },
      select: { id: true, nombre: true, apellido: true, dni: true },
    });
    if (!paciente) throw new PacienteSolicitudNoEncontradoError();

    const data = mapearDatos(datos, paciente);
    const cambios = Object.entries(data).filter(
      ([campo, valor]) => serializar(actual[campo]) !== serializar(valor),
    );
    if (cambios.length === 0) throw new SolicitudTransfusionSinCambiosError();

    const solicitud = await tx.solicitudTransfusion.update({
      where: { id },
      data,
      include: includePaciente,
    });

    await tx.solicitudTransfusionAuditoria.createMany({
      data: cambios.map(([campo]) => ({
        solicitudId: id,
        accion: "MODIFICACION",
        datoModificado: campo,
        valorAnterior: serializar(actual[campo]),
        valorNuevo: serializar(data[campo as keyof typeof data]),
        motivo: datos.motivoModificacion,
        operador: datos.operador,
      })),
    });

    return solicitud;
  });
}

export async function cancelar(
  id: number,
  datos: CancelarSolicitudTransfusionInput,
  db: SolicitudDbRoot = dbPredeterminada,
) {
  return db.$transaction(async (tx) => {
    const actual = await tx.solicitudTransfusion.findUnique({
      where: { id },
      include: { unidades: { where: { estado: "RESERVADA" }, select: { id: true } } },
    });
    if (!actual) throw new SolicitudTransfusionNoEncontradaError();
    if (actual.estado === "CANCELADA") throw new SolicitudTransfusionCanceladaError();
    if (actual.unidades.length > 0) throw new SolicitudTransfusionConUnidadesError();

    const solicitud = await tx.solicitudTransfusion.update({
      where: { id },
      data: { estado: "CANCELADA" },
      include: includePaciente,
    });

    await tx.solicitudTransfusionAuditoria.create({
      data: {
        solicitudId: id,
        accion: "CANCELACION",
        datoModificado: "estado",
        valorAnterior: actual.estado,
        valorNuevo: "CANCELADA",
        motivo: datos.motivo,
        operador: datos.operador,
      },
    });

    return solicitud;
  });
}
