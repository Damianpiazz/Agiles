import { describe, expect, it } from "vitest";
import { crearTamizajeInfeccionesSchema } from "./tamizajeInfecciones.types";

const resultados = Array.from({ length: 7 }, (_, index) => ({
  determinacionSerologicaId: index + 1,
  resultado: "NO_REACTIVO",
}));

const datosValidos = {
  donacionId: 12,
  fecha: "2026-10-26",
  operador: "Bioquímica de prueba",
  resultados,
};

describe("crearTamizajeInfeccionesSchema", () => {
  it("acepta siete resultados distintos asociados a una donación y una fecha", () => {
    expect(crearTamizajeInfeccionesSchema.safeParse(datosValidos).success).toBe(
      true,
    );
  });

  it("rechaza una cantidad incompleta de pruebas", () => {
    expect(
      crearTamizajeInfeccionesSchema.safeParse({
        ...datosValidos,
        resultados: resultados.slice(0, 6),
      }).success,
    ).toBe(false);
  });

  it("rechaza determinaciones duplicadas", () => {
    expect(
      crearTamizajeInfeccionesSchema.safeParse({
        ...datosValidos,
        resultados: [...resultados.slice(0, 6), resultados[0]],
      }).success,
    ).toBe(false);
  });

  it("rechaza resultados que no sean reactivos o no reactivos", () => {
    expect(
      crearTamizajeInfeccionesSchema.safeParse({
        ...datosValidos,
        resultados: resultados.map((resultado, index) =>
          index === 0 ? { ...resultado, resultado: "INDETERMINADO" } : resultado,
        ),
      }).success,
    ).toBe(false);
  });
});
