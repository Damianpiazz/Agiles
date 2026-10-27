import { describe, expect, it, vi } from "vitest";
import {
  crear,
  CatalogoTamizajeInvalidoError,
  DonacionNoEncontradaError,
} from "./tamizajeInfecciones.service";
import type { CrearTamizajeInfeccionesInput } from "../types/tamizajeInfecciones.types";

const nombres = [
  "Chagas",
  "HBsAg",
  "Anti-HBc",
  "Anti-HCV",
  "Anti-HIV",
  "VDRL (sífilis)",
  "Anti-HTLV I/II",
];

const datos: CrearTamizajeInfeccionesInput = {
  donacionId: 10,
  fecha: new Date("2026-10-26T00:00:00.000Z"),
  operador: "Bioquímica de prueba",
  resultados: nombres.map((_, index) => ({
    determinacionSerologicaId: index + 1,
    resultado: "NO_REACTIVO",
  })),
};

function fakeDb({
  donacion = { id: 10, donanteId: 4, estado: "REGISTRADA" },
  historial = [],
  determinaciones = nombres.map((nombre, index) => ({ id: index + 1, nombre })),
}: {
  donacion?: unknown;
  historial?: unknown[];
  determinaciones?: { id: number; nombre: string }[];
} = {}) {
  const tx = {
    donacion: {
      findUnique: vi.fn().mockResolvedValue(donacion),
      update: vi.fn().mockResolvedValue({ id: 10 }),
    },
    determinacionSerologica: {
      findMany: vi.fn().mockResolvedValue(determinaciones),
    },
    serologia: {
      create: vi.fn().mockResolvedValue({ id: 30, resultados: [], donaciones: [] }),
      findMany: vi.fn().mockResolvedValue(historial),
    },
  };

  return {
    tx,
    db: {
      $transaction: vi.fn(
        (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
      ),
      serologia: { findMany: vi.fn() },
    },
  };
}

describe("tamizajeInfecciones.service crear", () => {
  it("registra las siete pruebas vinculadas a la donación y la deja en calificación si son no reactivas", async () => {
    const { db, tx } = fakeDb();

    const resultado = await crear(datos, db as never);

    expect(tx.serologia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fecha: datos.fecha,
          resultados: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ resultado: "No reactivo" }),
            ]),
          }),
          donaciones: { create: [{ donacionId: 10 }] },
        }),
      }),
    );
    expect(tx.donacion.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { estado: "EN_CALIFICACION" },
    });
    expect(resultado).toMatchObject({
      estadoDonacion: "EN_CALIFICACION",
      bloqueada: false,
      pruebasReactivas: [],
      seroconversiones: [],
    });
  });

  it("bloquea una prueba reactiva y alerta una seroconversión", async () => {
    const historial = [
      {
        fecha: new Date("2026-01-01T00:00:00.000Z"),
        donaciones: [{ donacionId: 9 }],
        resultados: [{ determinacionSerologicaId: 2, resultado: "No reactivo" }],
      },
    ];
    const { db, tx } = fakeDb({ historial });
    const resultadoActual = datos.resultados.map((resultado) =>
      resultado.determinacionSerologicaId === 2
        ? { ...resultado, resultado: "REACTIVO" as const }
        : resultado,
    );

    const resultado = await crear(
      { ...datos, resultados: resultadoActual },
      db as never,
    );

    expect(tx.donacion.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { estado: "RECHAZADA" },
    });
    expect(resultado).toMatchObject({
      estadoDonacion: "RECHAZADA",
      bloqueada: true,
      pruebasReactivas: ["HBsAg"],
      seroconversiones: ["HBsAg"],
    });
  });

  it("no registra resultados si la donación no existe", async () => {
    const { db, tx } = fakeDb({ donacion: null });

    await expect(crear(datos, db as never)).rejects.toBeInstanceOf(
      DonacionNoEncontradaError,
    );
    expect(tx.serologia.create).not.toHaveBeenCalled();
  });

  it("rechaza un catálogo que no permite identificar las siete pruebas", async () => {
    const { db, tx } = fakeDb({ determinaciones: [{ id: 1, nombre: "Chagas" }] });

    await expect(crear(datos, db as never)).rejects.toBeInstanceOf(
      CatalogoTamizajeInvalidoError,
    );
    expect(tx.serologia.create).not.toHaveBeenCalled();
  });
});
