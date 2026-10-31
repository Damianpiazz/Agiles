import { describe, expect, it, vi } from "vitest";

import {
  cambiarEstadoUnidad,
  EstudiosIncompletosError,
  UnidadNoAptaError,
} from "./liberacionUnidad.service";

function crearDonacion({
  reactivo = false,
  discrepancia = false,
  conAnticuerpos = true,
} = {}) {
  return {
    id: 1,
    donanteId: 10,
    estadoUnidad: "PENDIENTE",
    discrepanciaResuelta: false,
    observacionDiscrepancia: null,

    donante: {
      id: 10,
      nombre: "Juan",
      apellido: "Perez",
      dni: "12345678",
    },

    anticuerpoIrregular: conAnticuerpos
      ? {
          resultado: "NEGATIVO",
        }
      : null,

    tipificacionesSanguineas: [
      {
        grupoABO: "A",
        factorRhD: "POSITIVO",
        fechaHora: new Date(),
      },
    ],

    serologiaDonaciones: [
      {
        serologia: {
          createdAt: new Date(),
          resultados: Array.from({ length: 7 }, (_, i) => ({
            resultado:
              reactivo && i === 0
                ? "Reactivo"
                : "No reactivo",

            determinacionSerologica: {
              nombre: `Prueba ${i + 1}`,
            },
          })),
        },
      },
    ],

    _discrepancia: discrepancia,
  };
}

function fakeDb(opciones: any = {}) {
  const donacion = crearDonacion(opciones);

  const update = vi.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      ...donacion,
      ...data,
    }),
  );

  const createEvento = vi.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      id: 1,
      fechaHora: new Date(),
      ...data,
    }),
  );

  return {
    donacion: {
      findUnique: vi.fn().mockResolvedValue(donacion),
    },

    tipificacionSanguinea: {
      findFirst: vi.fn().mockResolvedValue(
        opciones.discrepancia
          ? {
              grupoABO: "B",
              factorRhD: "POSITIVO",
            }
          : {
              grupoABO: "A",
              factorRhD: "POSITIVO",
            },
      ),
    },

    $transaction: vi.fn().mockImplementation(async (callback) =>
      callback({
        donacion: {
          update,
        },
        eventoEstadoUnidad: {
          create: createEvento,
        },
      }),
    ),

    _update: update,
    _createEvento: createEvento,
  };
}

describe("liberacionUnidad.service", () => {
  it("permite liberar una unidad apta", async () => {
    const db = fakeDb();

    const resultado = await cambiarEstadoUnidad(
      1,
      {
        accion: "LIBERAR",
        usuario: "Jerónimo",
        discrepanciaResuelta: false,
      },
      db as never,
    );

    expect(resultado.estadoUnidad).toBe("LIBERADA");

    expect(db._update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoUnidad: "LIBERADA",
        }),
      }),
    );
  });

  it("impide liberar si faltan estudios", async () => {
    const db = fakeDb({
      conAnticuerpos: false,
    });

    await expect(
      cambiarEstadoUnidad(
        1,
        {
          accion: "LIBERAR",
          usuario: "Jerónimo",
          discrepanciaResuelta: false,
        },
        db as never,
      ),
    ).rejects.toBeInstanceOf(EstudiosIncompletosError);
  });

  it("bloquea una unidad con ITT reactivo", async () => {
    const db = fakeDb({
      reactivo: true,
    });

    await expect(
      cambiarEstadoUnidad(
        1,
        {
          accion: "LIBERAR",
          usuario: "Jerónimo",
          discrepanciaResuelta: false,
        },
        db as never,
      ),
    ).rejects.toBeInstanceOf(UnidadNoAptaError);

    expect(db._update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoUnidad: "BLOQUEADA",
        }),
      }),
    );
  });

  it("impide liberar una discrepancia no resuelta", async () => {
    const db = fakeDb({
      discrepancia: true,
    });

    await expect(
      cambiarEstadoUnidad(
        1,
        {
          accion: "LIBERAR",
          usuario: "Jerónimo",
          discrepanciaResuelta: false,
        },
        db as never,
      ),
    ).rejects.toBeInstanceOf(UnidadNoAptaError);
  });

  it("permite liberar una discrepancia documentada", async () => {
    const db = fakeDb({
      discrepancia: true,
    });

    const resultado = await cambiarEstadoUnidad(
      1,
      {
        accion: "LIBERAR",
        usuario: "Jerónimo",
        discrepanciaResuelta: true,
        observacionDiscrepancia:
          "Se repitió tipificación y se confirmó el resultado actual.",
      },
      db as never,
    );

    expect(resultado.estadoUnidad).toBe("LIBERADA");
  });
});