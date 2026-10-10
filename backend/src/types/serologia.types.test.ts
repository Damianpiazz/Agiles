import { describe, expect, it } from "vitest";
import { crearSerologiaSchema, idSerologiaSchema } from "./serologia.types";

const base = {
  fecha: "2026-01-10",
  hora: "14:05",
  donacionIds: [1],
  resultados: [{ determinacionSerologicaId: 1, resultado: "No reactivo" }],
};

describe("crearSerologiaSchema", () => {
  it("acepta datos válidos", () => {
    expect(crearSerologiaSchema.safeParse(base).success).toBe(true);
  });

  it("acepta resultados con valor y unidad opcionales", () => {
    expect(
      crearSerologiaSchema.safeParse({
        ...base,
        resultados: [
          { determinacionSerologicaId: 1, resultado: "Reactivo", valor: "1.2", unidad: "S/CO" },
        ],
      }).success,
    ).toBe(true);
  });

  it("rechaza hora con formato inválido", () => {
    expect(
      crearSerologiaSchema.safeParse({ ...base, hora: "24:00" }).success,
    ).toBe(false);
  });

  it("rechaza lista de donaciones vacía", () => {
    expect(
      crearSerologiaSchema.safeParse({ ...base, donacionIds: [] }).success,
    ).toBe(false);
  });

  it("rechaza lista de resultados vacía", () => {
    expect(
      crearSerologiaSchema.safeParse({ ...base, resultados: [] }).success,
    ).toBe(false);
  });
});

describe("idSerologiaSchema", () => {
  it("acepta un entero positivo", () => {
    expect(idSerologiaSchema.safeParse("7").success).toBe(true);
  });

  it("rechaza cero, negativos y no numéricos", () => {
    expect(idSerologiaSchema.safeParse("0").success).toBe(false);
    expect(idSerologiaSchema.safeParse("-1").success).toBe(false);
    expect(idSerologiaSchema.safeParse("x").success).toBe(false);
  });
});
