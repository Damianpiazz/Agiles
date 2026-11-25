import { prisma } from "../config/prisma";

export class DniInvalidoError extends Error {
  constructor() {
    super("DNI inválido (7 u 8 dígitos).");
    this.name = "DniInvalidoError";
  }
}

type Registro = Record<string, any>;

export type PersonaHistorialDb = {
  donante: { findUnique(args: unknown): Promise<Registro | null> };
  paciente: { findUnique(args: unknown): Promise<Registro | null> };
  donacion: { findMany(args: unknown): Promise<Registro[]> };
  solicitudTransfusion: { findMany(args: unknown): Promise<Registro[]> };
  emisionUnidad: { findMany(args: unknown): Promise<Registro[]> };
  estudioPretransfusional: { findMany(args: unknown): Promise<Registro[]> };
};

const dbPredeterminada = prisma as unknown as PersonaHistorialDb;

/**
 * Historia integral de una persona a partir de su DNI. Cruza los datos reales
 * de donante, paciente, donaciones, solicitudes, emisiones y estudios.
 * No crea ni infiere registros: si el DNI no existe en un rol, devuelve null
 * para ese rol. Las solicitudes legacy se incluyen por dniPaciente aunque no
 * tengan pacienteId vinculado.
 */
export async function consultar(
  dni: string,
  db: PersonaHistorialDb = dbPredeterminada,
) {
  if (!/^\d{7,8}$/.test(dni)) {
    throw new DniInvalidoError();
  }

  const [donante, paciente] = await Promise.all([
    db.donante.findUnique({
      where: { dni },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        activo: true,
        fechaNacimiento: true,
        createdAt: true,
      },
    }),
    db.paciente.findUnique({
      where: { dni },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        fechaNacimiento: true,
        operador: true,
        createdAt: true,
      },
    }),
  ]);

  const filtroSolicitudes = {
    OR: [
      { dniPaciente: dni },
      ...(paciente ? [{ pacienteId: paciente.id }] : []),
    ],
  };

  const [donaciones, solicitudes, emisiones, estudios] = await Promise.all([
    donante
      ? db.donacion.findMany({
          where: { donanteId: donante.id },
          include: {
            calificacionBiologica: {
              select: { id: true, estado: true, fechaInicio: true, operador: true },
            },
            tipificacionesSanguineas: {
              select: {
                id: true,
                grupoABO: true,
                factorRhD: true,
                fechaHora: true,
                operador: true,
              },
              orderBy: [{ fechaHora: "desc" }],
            },
            anticuerpoIrregular: {
              select: {
                id: true,
                resultado: true,
                fechaHora: true,
                operador: true,
              },
            },
            eventosEstadoUnidad: {
              select: {
                id: true,
                estado: true,
                motivo: true,
                usuario: true,
                fechaHora: true,
              },
              orderBy: [{ fechaHora: "desc" }],
            },
          },
          orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
        })
      : Promise.resolve([]),
    db.solicitudTransfusion.findMany({
      where: filtroSolicitudes,
      include: {
        auditoria: {
          select: {
            id: true,
            accion: true,
            datoModificado: true,
            motivo: true,
            operador: true,
            fechaHora: true,
          },
          orderBy: [{ fechaHora: "desc" }],
        },
      },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    }),
    db.emisionUnidad.findMany({
      where: { dniPaciente: dni },
      include: {
        unidadSangre: {
          select: { id: true, numeroUnidad: true, estado: true },
        },
      },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    }),
    db.estudioPretransfusional.findMany({
      where: { solicitud: { dniPaciente: dni } },
      include: {
        solicitud: {
          select: { id: true, dniPaciente: true, nombrePaciente: true, estado: true },
        },
        unidadSangre: {
          select: { id: true, numeroUnidad: true },
        },
      },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    }),
  ]);

  return {
    dni,
    donante,
    paciente,
    donaciones,
    solicitudes,
    emisiones,
    estudios,
    resumen: {
      esDonante: donante !== null,
      esPaciente: paciente !== null || solicitudes.length > 0,
      donanteActivo: donante?.activo ?? null,
      totalDonaciones: donaciones.length,
      totalSolicitudes: solicitudes.length,
      totalEmisiones: emisiones.length,
      totalEstudios: estudios.length,
    },
  };
}
