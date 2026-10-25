
import { describe, expect, it } from "vitest";
import {
  crearTipificacionSanguineaSchema,
  idTipificacionSanguineaSchema,
} from "./tipificacionSanguinea.types";

describe("crearTipificacionSanguineaSchema", () => {
  const datosValidos = {
    donacionId: 1,
    grupoABO: "A",
    factorRhD: "POSITIVO",
    operador: "Operador de prueba",
  };

  it.each(["A", "B", "AB", "O"])(
    "acepta el grupo sanguíneo %s",
    (grupoABO) => {
      const resultado = crearTipificacionSanguineaSchema.safeParse({
        ...datosValidos,
        grupoABO,
      });

      expect(resultado.success).toBe(true);
    },
  );

  it.each(["POSITIVO", "NEGATIVO"])(
    "acepta el factor RhD %s",
    (factorRhD) => {
      const resultado = crearTipificacionSanguineaSchema.safeParse({
        ...datosValidos,
        factorRhD,
      });

      expect(resultado.success).toBe(true);
    },
  );

  it("rechaza un grupo sanguíneo inválido", () => {
    const resultado = crearTipificacionSanguineaSchema.safeParse({
      ...datosValidos,
      grupoABO: "C",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza un factor RhD inválido", () => {
    const resultado = crearTipificacionSanguineaSchema.safeParse({
      ...datosValidos,
      factorRhD: "NEUTRO",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza una donación con ID inválido", () => {
    const resultado = crearTipificacionSanguineaSchema.safeParse({
      ...datosValidos,
      donacionId: 0,
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza un operador vacío", () => {
    const resultado = crearTipificacionSanguineaSchema.safeParse({
      ...datosValidos,
      operador: "   ",
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza un operador que supera los 120 caracteres", () => {
    const resultado = crearTipificacionSanguineaSchema.safeParse({
      ...datosValidos,
      operador: "a".repeat(121),
    });

    expect(resultado.success).toBe(false);
  });

  it("acepta el ID de tipificación como número entero positivo", () => {
    expect(idTipificacionSanguineaSchema.safeParse("1").success).toBe(true);
  });

  it("rechaza un ID de tipificación inválido", () => {
    expect(idTipificacionSanguineaSchema.safeParse("abc").success).toBe(false);
    expect(idTipificacionSanguineaSchema.safeParse("0").success).toBe(false);
  });
});
