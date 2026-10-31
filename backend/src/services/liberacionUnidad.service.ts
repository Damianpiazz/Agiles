import { prisma } from "../config/prisma";
import type { CambiarEstadoUnidadInput } from "../types/liberacionUnidad.types";

type Tx = {
  donacion: {
    update(args: any): Promise<any>;
  };
  eventoEstadoUnidad: {
    create(args: any): Promise<any>;
  };
};

type LiberacionUnidadDb = {
  donacion: {
    findUnique(args: any): Promise<any>;
  };
  tipificacionSanguinea: {
    findFirst(args: any): Promise<any>;
  };
  $transaction<T>(callback: (tx: Tx) => Promise<T>): Promise<T>;
};

const dbPredeterminada = prisma as unknown as LiberacionUnidadDb;

export class DonacionNoEncontradaError extends Error {
  constructor() {
    super("La donación no existe.");
    this.name = "DonacionNoEncontradaError";
  }
}

export class EstudiosIncompletosError extends Error {
  constructor(public evaluacion: any) {
    super("La unidad no tiene todos los estudios requeridos.");
    this.name = "EstudiosIncompletosError";
  }
}

export class UnidadNoAptaError extends Error {
  constructor(
    message: string,
    public evaluacion: any,
  ) {
    super(message);
    this.name = "UnidadNoAptaError";
  }
}

function normalizarResultado(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function evaluarUnidad(
  donacionId: number,
  db: LiberacionUnidadDb = dbPredeterminada,
) {
  const donacion = await db.donacion.findUnique({
    where: { id: donacionId },
    include: {
      donante: true,

      anticuerpoIrregular: true,

      tipificacionesSanguineas: {
        orderBy: {
          fechaHora: "desc",
        },
      },

      serologiaDonaciones: {
        include: {
          serologia: {
            include: {
              resultados: {
                include: {
                  determinacionSerologica: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!donacion) {
    throw new DonacionNoEncontradaError();
  }

  const tipificacionActual =
    donacion.tipificacionesSanguineas?.[0] ?? null;

  const serologias = [...(donacion.serologiaDonaciones ?? [])].sort(
    (a: any, b: any) =>
      new Date(b.serologia.createdAt).getTime() -
      new Date(a.serologia.createdAt).getTime(),
  );

  const serologiaActual = serologias[0]?.serologia ?? null;
  const resultadosITT = serologiaActual?.resultados ?? [];

  const pruebasReactivas = resultadosITT
    .filter((resultado: any) => {
      const valor = normalizarResultado(resultado.resultado);

      return valor === "reactivo" || valor === "positivo";
    })
    .map(
      (resultado: any) =>
        resultado.determinacionSerologica?.nombre ??
        "Determinación desconocida",
    );

  let tipificacionAnterior = null;

  if (tipificacionActual) {
    tipificacionAnterior =
      await db.tipificacionSanguinea.findFirst({
        where: {
          donacionId: {
            not: donacionId,
          },
          donacion: {
            donanteId: donacion.donanteId,
          },
        },
        orderBy: {
          fechaHora: "desc",
        },
      });
  }

  const discrepanciaDetectada = Boolean(
    tipificacionActual &&
      tipificacionAnterior &&
      (tipificacionActual.grupoABO !==
        tipificacionAnterior.grupoABO ||
        tipificacionActual.factorRhD !==
          tipificacionAnterior.factorRhD),
  );

  const discrepanciaPendiente =
    discrepanciaDetectada && !donacion.discrepanciaResuelta;

  const faltantes: string[] = [];

  if (!tipificacionActual) {
    faltantes.push("Tipificación ABO/RhD");
  }

  if (resultadosITT.length < 7) {
    faltantes.push("Tamizaje ITT");
  }

  if (!donacion.anticuerpoIrregular) {
    faltantes.push("Anticuerpos irregulares");
  }

  const motivosBloqueo: string[] = [];

  if (pruebasReactivas.length > 0) {
    motivosBloqueo.push(
      `ITT reactivo: ${pruebasReactivas.join(", ")}`,
    );
  }

  if (discrepanciaPendiente) {
    motivosBloqueo.push(
      "Existe una discrepancia ABO/RhD con el registro previo del donante",
    );
  }

  const advertencias: string[] = [];

  if (donacion.anticuerpoIrregular?.resultado === "POSITIVO") {
    advertencias.push(
      "La unidad presenta anticuerpos irregulares positivos y requiere manejo especial.",
    );
  }

  return {
    donacionId: donacion.id,

    donante: {
      id: donacion.donante.id,
      nombre: donacion.donante.nombre,
      apellido: donacion.donante.apellido,
      dni: donacion.donante.dni,
    },

    estadoUnidad: donacion.estadoUnidad,

    estudios: {
      tipificacion: tipificacionActual
        ? {
            grupoABO: tipificacionActual.grupoABO,
            factorRhD: tipificacionActual.factorRhD,
          }
        : null,

      tamizaje: {
        cargado: resultadosITT.length >= 7,
        pruebasReactivas,
      },

      anticuerposIrregulares: {
        cargado: Boolean(donacion.anticuerpoIrregular),
        resultado:
          donacion.anticuerpoIrregular?.resultado ?? null,
      },
    },

    discrepancia: {
      detectada: discrepanciaDetectada,
      resuelta: donacion.discrepanciaResuelta,
      pendiente: discrepanciaPendiente,

      actual: tipificacionActual
        ? {
            grupoABO: tipificacionActual.grupoABO,
            factorRhD: tipificacionActual.factorRhD,
          }
        : null,

      anterior: tipificacionAnterior
        ? {
            grupoABO: tipificacionAnterior.grupoABO,
            factorRhD: tipificacionAnterior.factorRhD,
          }
        : null,

      observacion:
        donacion.observacionDiscrepancia ?? null,
    },

    faltantes,
    motivosBloqueo,
    advertencias,

    puedeLiberarse:
      faltantes.length === 0 &&
      pruebasReactivas.length === 0 &&
      !discrepanciaPendiente,
  };
}

async function registrarEstado(
  donacionId: number,
  estado: "LIBERADA" | "BLOQUEADA",
  datos: {
    usuario: string;
    motivo?: string;
    discrepanciaResuelta?: boolean;
    observacionDiscrepancia?: string;
  },
  db: LiberacionUnidadDb,
) {
  return db.$transaction(async (tx) => {
    const donacion = await tx.donacion.update({
      where: {
        id: donacionId,
      },
      data: {
        estadoUnidad: estado,

        ...(datos.discrepanciaResuelta !== undefined
          ? {
              discrepanciaResuelta:
                datos.discrepanciaResuelta,
            }
          : {}),

        ...(datos.observacionDiscrepancia
          ? {
              observacionDiscrepancia:
                datos.observacionDiscrepancia,
            }
          : {}),
      },
    });

    const evento = await tx.eventoEstadoUnidad.create({
      data: {
        donacionId,
        estado,
        motivo: datos.motivo,
        usuario: datos.usuario,
        discrepanciaResuelta:
          datos.discrepanciaResuelta ?? false,
        observacionDiscrepancia:
          datos.observacionDiscrepancia,
      },
    });

    return {
      donacion,
      evento,
    };
  });
}

export async function cambiarEstadoUnidad(
  donacionId: number,
  datos: CambiarEstadoUnidadInput,
  db: LiberacionUnidadDb = dbPredeterminada,
) {
  const evaluacion = await evaluarUnidad(donacionId, db);

  if (datos.accion === "BLOQUEAR") {
    const cambio = await registrarEstado(
      donacionId,
      "BLOQUEADA",
      {
        usuario: datos.usuario,
        motivo: datos.motivo,
        discrepanciaResuelta:
          datos.discrepanciaResuelta,
        observacionDiscrepancia:
          datos.observacionDiscrepancia,
      },
      db,
    );

    return {
      estadoUnidad: "BLOQUEADA",
      evento: cambio.evento,
      evaluacion: {
        ...evaluacion,
        estadoUnidad: "BLOQUEADA",
        puedeLiberarse: false,
      },
    };
  }

  if (evaluacion.faltantes.length > 0) {
    throw new EstudiosIncompletosError(evaluacion);
  }

  if (evaluacion.estudios.tamizaje.pruebasReactivas.length > 0) {
    const motivo =
      `ITT reactivo: ${evaluacion.estudios.tamizaje.pruebasReactivas.join(", ")}`;

    const cambio = await registrarEstado(
      donacionId,
      "BLOQUEADA",
      {
        usuario: datos.usuario,
        motivo,
      },
      db,
    );

    throw new UnidadNoAptaError(motivo, {
      ...evaluacion,
      estadoUnidad: "BLOQUEADA",
      puedeLiberarse: false,
      ultimoEvento: cambio.evento,
    });
  }

  const discrepanciaResuelta =
    evaluacion.discrepancia.resuelta ||
    datos.discrepanciaResuelta;

  if (
    evaluacion.discrepancia.detectada &&
    !discrepanciaResuelta
  ) {
    const motivo =
      "Existe una discrepancia ABO/RhD pendiente de resolución.";

    const cambio = await registrarEstado(
      donacionId,
      "BLOQUEADA",
      {
        usuario: datos.usuario,
        motivo,
      },
      db,
    );

    throw new UnidadNoAptaError(motivo, {
      ...evaluacion,
      estadoUnidad: "BLOQUEADA",
      puedeLiberarse: false,
      ultimoEvento: cambio.evento,
    });
  }

  const cambio = await registrarEstado(
    donacionId,
    "LIBERADA",
    {
      usuario: datos.usuario,

      discrepanciaResuelta:
        evaluacion.discrepancia.detectada
          ? discrepanciaResuelta
          : undefined,

      observacionDiscrepancia:
        datos.observacionDiscrepancia ??
        evaluacion.discrepancia.observacion ??
        undefined,
    },
    db,
  );

  return {
    estadoUnidad: "LIBERADA",
    evento: cambio.evento,

    evaluacion: {
      ...evaluacion,
      estadoUnidad: "LIBERADA",
      puedeLiberarse: true,

      discrepancia: {
        ...evaluacion.discrepancia,
        resuelta: discrepanciaResuelta,
        pendiente: false,
      },
    },
  };
}