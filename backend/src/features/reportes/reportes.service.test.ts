import { describe, expect, it } from "vitest";
import { aptitudDeDonacion } from "./reportes.service";

type Donacion = Parameters<typeof aptitudDeDonacion>[0];

function donacion(resultados: string[], autoexcluido = false): Donacion {
  return {
    id: 1,
    fecha: new Date("2026-06-01T00:00:00.000Z"),
    voluntario: true,
    reposicion: false,
    autoexcluido,
    persona: null,
    serologiaDonaciones: [
      {
        serologia: {
          tipoMuestra: "PRIMERA",
          resultados: resultados.map((resultado) => ({ resultado })),
        },
      },
    ],
  };
}

describe("aptitudDeDonacion", () => {
  it("devuelve sin estudios cuando no hay resultados", () => {
    expect(aptitudDeDonacion(donacion([]))).toBe("SIN_ESTUDIOS");
  });

  it("considera excluida una donación autoexcluida", () => {
    expect(aptitudDeDonacion(donacion(["No reactivo"], true))).toBe("EXCLUIDO");
  });

  it("considera excluida una donación con serología reactiva", () => {
    expect(aptitudDeDonacion(donacion(["Reactivo"]))).toBe("EXCLUIDO");
  });

  it("deja en revisión una donación con resultado dudoso", () => {
    expect(aptitudDeDonacion(donacion(["Dudoso"]))).toBe("REVISAR");
  });

  it("considera apta una donación sin hallazgos", () => {
    expect(aptitudDeDonacion(donacion(["No reactivo"]))).toBe("APTO");
  });
});
