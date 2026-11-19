import { describe, expect, it } from "vitest";
import { bajaUnidadSchema } from "./bajaUnidad";

describe("bajaUnidadSchema", () => {
  it("acepta una baja con unidad, motivo y operador válidos", () => {
    const resultado = bajaUnidadSchema.safeParse({
      unidadId: "1",
      motivo: "DESCARTADA",
      operador: "Laura Gómez",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.unidadId).toBe(1);
      expect(resultado.data.motivo).toBe("DESCARTADA");
    }
  });

  it("rechaza cuando no se selecciona una unidad", () => {
    const resultado = bajaUnidadSchema.safeParse({
      unidadId: "",
      motivo: "VENCIDA",
      operador: "Laura Gómez",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando falta el motivo", () => {
    const resultado = bajaUnidadSchema.safeParse({
      unidadId: "1",
      motivo: "",
      operador: "Laura Gómez",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando falta el operador", () => {
    const resultado = bajaUnidadSchema.safeParse({
      unidadId: "1",
      motivo: "TRANSFUNDIDA",
      operador: "   ",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza una unidad no numérica o no positiva", () => {
    expect(
      bajaUnidadSchema.safeParse({
        unidadId: "0",
        motivo: "VENCIDA",
        operador: "A",
      }).success,
    ).toBe(false);
    expect(
      bajaUnidadSchema.safeParse({
        unidadId: "abc",
        motivo: "VENCIDA",
        operador: "A",
      }).success,
    ).toBe(false);
  });

  it("rechaza un motivo fuera del enum", () => {
    expect(
      bajaUnidadSchema.safeParse({
        unidadId: "1",
        motivo: "ROTA",
        operador: "A",
      }).success,
    ).toBe(false);
  });
});
