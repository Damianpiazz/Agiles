import { describe, expect, it } from "vitest";
import { crearPciSchema, idPciSchema } from "./pci.types";

const base = {
  fecha: "2026-01-10",
  hora: "08:30",
  donacionIds: [1],
  resultados: [{ antigenoId: 1, resultado: "Positivo" }],
};

describe("crearPciSchema", () => {
  it("acepta datos válidos", () => {
    expect(crearPciSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza hora con formato inválido", () => {
    expect(crearPciSchema.safeParse({ ...base, hora: "25:00" }).success).toBe(
      false,
    );
    expect(crearPciSchema.safeParse({ ...base, hora: "8:30" }).success).toBe(
      false,
    );
  });

  it("rechaza lista de donaciones vacía", () => {
    expect(
      crearPciSchema.safeParse({ ...base, donacionIds: [] }).success,
    ).toBe(false);
  });

  it("rechaza lista de resultados vacía", () => {
    expect(
      crearPciSchema.safeParse({ ...base, resultados: [] }).success,
    ).toBe(false);
  });

  it("rechaza un resultado sin resultado textual", () => {
    expect(
      crearPciSchema.safeParse({
        ...base,
        resultados: [{ antigenoId: 1, resultado: "  " }],
      }).success,
    ).toBe(false);
  });
});

describe("idPciSchema", () => {
  it("acepta un entero positivo", () => {
    expect(idPciSchema.safeParse("7").success).toBe(true);
  });

  it("rechaza cero, negativos y no numéricos", () => {
    expect(idPciSchema.safeParse("0").success).toBe(false);
    expect(idPciSchema.safeParse("-1").success).toBe(false);
    expect(idPciSchema.safeParse("x").success).toBe(false);
  });
});
