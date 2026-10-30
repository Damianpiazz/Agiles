import { prisma } from "../config/prisma";
import type { RegistrarAnticuerpoIrregularInput } from "../types/anticuerpoIrregular.types";

export class DonacionNoEncontradaError extends Error {
  constructor() {
    super("La donación no existe.");
    this.name = "DonacionNoEncontradaError";
  }
}

export class CalificacionBiologicaNoIniciadaError extends Error {
  constructor() {
    super(
      "La donación no tiene una calificación biológica iniciada para registrar este resultado.",
    );
    this.name = "CalificacionBiologicaNoIniciadaError";
  }
}

type AnticuerpoIrregularDb = {
  donacion: {
    findUnique: (args: any) => Promise<any>;
  };
  calificacionBiologica: {
    findUnique: (args: { where: { donacionId: number } }) => Promise<any>;
  };
  anticuerpoIrregular: {
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
  };
};

const dbPredeterminada = prisma as unknown as AnticuerpoIrregularDb;

function construirRespuesta(registro: any) {
  const esPositivo = registro.resultado === "POSITIVO";

  return {
    ...registro,
    donanteId: registro.donacion?.donante?.id ?? null,
    etiquetaComponente: esPositivo
      ? "con anticuerpos irregulares"
      : "sin anticuerpos irregulares",
    indicacion: esPositivo
      ? "Reservar para un receptor sin el antígeno correspondiente o desplasmatizar completamente."
      : "No requiere reserva especial.",
    advertenciaPlasma: esPositivo
      ? "Se recomienda no utilizar los componentes plasmáticos derivados de esta unidad."
      : null,
    notificacionDonante: esPositivo
      ? "Corresponde notificar al donante sobre el resultado."
      : null,
  };
}

export async function registrarResultado(
  datos: RegistrarAnticuerpoIrregularInput,
  db: AnticuerpoIrregularDb = dbPredeterminada,
) {
  const donacion = await db.donacion.findUnique({
    where: { id: datos.donacionId },
    include: { donante: true },
  });

  if (!donacion) {
    throw new DonacionNoEncontradaError();
  }

  const calificacion = await db.calificacionBiologica.findUnique({
    where: { donacionId: datos.donacionId },
  });

  if (!calificacion) {
    throw new CalificacionBiologicaNoIniciadaError();
  }

  const registro = await db.anticuerpoIrregular.upsert({
    where: { donacionId: datos.donacionId },
    create: {
      donacionId: datos.donacionId,
      resultado: datos.resultado,
      operador: datos.operador,
      observacion: datos.observacion,
    },
    update: {
      resultado: datos.resultado,
      operador: datos.operador,
      observacion: datos.observacion,
    },
    include: {
      donacion: {
        include: {
          donante: true,
        },
      },
    },
  });

  return construirRespuesta(registro);
}

export async function buscarPorId(
  id: number,
  db: AnticuerpoIrregularDb = dbPredeterminada,
) {
  const registro = await db.anticuerpoIrregular.findUnique({
    where: { id },
    include: {
      donacion: {
        include: {
          donante: true,
        },
      },
    },
  });

  return registro ? construirRespuesta(registro) : null;
}

export async function buscarPorDonacion(
  donacionId: number,
  db: AnticuerpoIrregularDb = dbPredeterminada,
) {
  const registro = await db.anticuerpoIrregular.findUnique({
    where: { donacionId },
    include: {
      donacion: {
        include: {
          donante: true,
        },
      },
    },
  });

  return registro ? construirRespuesta(registro) : null;
}

export async function listarPorDonacion(
  donacionId: number,
  db: AnticuerpoIrregularDb = dbPredeterminada,
) {
  const registros = await db.anticuerpoIrregular.findMany({
    where: { donacionId },
    orderBy: { fechaHora: "desc" },
    include: {
      donacion: {
        include: {
          donante: true,
        },
      },
    },
  });

  return registros.map((registro: any) => construirRespuesta(registro));
}
