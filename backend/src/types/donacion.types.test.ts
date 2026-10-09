import { describe, expect, it } from "vitest";
import { crearDonacionSchema, idDonacionSchema } from "./donacion.types";

describe("crearDonacionSchema", () => {
  it("acepta datos válidos completos", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana Operadora",
      observaciones: "Extracción sin incidentes",
    });

    expect(resultado.success).toBe(true);
  });

  it("acepta la donación sin observaciones (opcional)", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 2,
      operador: "Ana Operadora",
    });

    expect(resultado.success).toBe(true);
  });

  it("rechaza operador vacío con mensaje Obligatorio", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "   ",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe("Obligatorio");
    }
  });

  it("rechaza donanteId faltante", () => {
    const resultado = crearDonacionSchema.safeParse({ operador: "Ana" });

    expect(resultado.success).toBe(false);
  });

  it("rechaza donanteId cero o negativo", () => {
    expect(
      crearDonacionSchema.safeParse({ donanteId: 0, operador: "Ana" }).success,
    ).toBe(false);
    expect(
      crearDonacionSchema.safeParse({ donanteId: -5, operador: "Ana" }).success,
    ).toBe(false);
  });

  it("rechaza donanteId no numérico", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: "abc",
      operador: "Ana",
    });

    expect(resultado.success).toBe(false);
  });

  it("coerciona un donanteId enviado como string numérico", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: "5",
      operador: "Ana",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.donanteId).toBe(5);
    }
  });

  it("acepta los datos clínicos y las banderas de la donación", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana",
      peso: "78",
      tensionArterial: "120/80",
      hemoglobina: "14.5",
      voluntario: true,
      reposicion: true,
      autoExcluido: false,
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.peso).toBe("78");
      expect(resultado.data.tensionArterial).toBe("120/80");
      expect(resultado.data.hemoglobina).toBe("14.5");
      expect(resultado.data.voluntario).toBe(true);
      expect(resultado.data.reposicion).toBe(true);
      expect(resultado.data.autoExcluido).toBe(false);
    }
  });

  it("aplica false por defecto a las banderas cuando no vienen", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.voluntario).toBe(false);
      expect(resultado.data.reposicion).toBe(false);
      expect(resultado.data.autoExcluido).toBe(false);
    }
  });

  it("rechaza banderas con valores no booleanos", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana",
      voluntario: "si",
    });

    expect(resultado.success).toBe(false);
  });

  it("coerciona una fechaHora válida a Date", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana",
      fechaHora: "2026-01-10T08:30",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.fechaHora).toBeInstanceOf(Date);
    }
  });

  it("rechaza una fechaHora inválida", () => {
    const resultado = crearDonacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana",
      fechaHora: "no-es-fecha",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("idDonacionSchema", () => {
  it("acepta un entero positivo", () => {
    expect(idDonacionSchema.safeParse("7").success).toBe(true);
  });

  it("rechaza cero, negativos y no numéricos", () => {
    expect(idDonacionSchema.safeParse("0").success).toBe(false);
    expect(idDonacionSchema.safeParse("-1").success).toBe(false);
    expect(idDonacionSchema.safeParse("x").success).toBe(false);
  });
});
