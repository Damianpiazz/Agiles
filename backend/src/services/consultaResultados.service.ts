
import { prisma } from "../config/prisma";

export class DonanteNoEncontradoError extends Error {
  constructor() {
    super("No se encontró un donante con el DNI ingresado.");
    this.name = "DonanteNoEncontradoError";
  }
}

export type ConsultaResultadosDb = {
  donante: {
    findUnique(args: any): Promise<any>;
  };
};

const dbPredeterminada = prisma as unknown as ConsultaResultadosDb;

export async function consultarPorDni(
  dni: string,
  db: ConsultaResultadosDb = dbPredeterminada,
) {
  const donante = await db.donante.findUnique({
    where: { dni },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      donaciones: {
        orderBy: {
          fechaHora: "asc",
        },
        select: {
          id: true,
          fechaHora: true,
          estado: true,
          operador: true,
          estadoUnidad: true,
          discrepanciaResuelta: true,
          observacionDiscrepancia: true,

          calificacionBiologica: true,

          tipificacionesSanguineas: {
            orderBy: {
              fechaHora: "desc",
            },
          },

          pciDonaciones: {
            include: {
              pci: {
                include: {
                  resultados: {
                    include: {
                      antigeno: true,
                    },
                  },
                },
              },
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

          anticuerpoIrregular: true,

          eventosEstadoUnidad: {
            orderBy: {
              fechaHora: "desc",
            },
          },
        },
      },
    },
  });

  if (!donante) {
    throw new DonanteNoEncontradoError();
  }

  return donante;
}
