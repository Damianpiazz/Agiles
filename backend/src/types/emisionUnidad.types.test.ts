import { describe, expect, it } from "vitest";
import {
  emitirUnidadSchema,
  idSolicitudEmisionSchema,
  idUnidadEmisionSchema,
} from "./emisionUnidad.types";

describe("idSolicitudEmisionSchema e idUnidadEmisionSchema", () => {
  it("aceptan enteros positivos incluso como strings numéricos", () => {
    expect(idSolicitudEmisionSchema.safeParse("12").success).toBe(true);
    expect(idSolicitudEmisionSchema.safeParse(7).success).toBe(true);
    expect(idUnidadEmisionSchema.safeParse("45").success).toBe(true);
  });

  it("rechazan cero, negativos, decimales o texto no numérico", () => {
    for (const invalido of ["0", "-3", "1.5", "abc", "", null, undefined]) {
      expect(idSolicitudEmisionSchema.safeParse(invalido).success).toBe(false);
      expect(idUnidadEmisionSchema.safeParse(invalido).success).toBe(false);
    }
  });
});

describe("emitirUnidadSchema", () => {
  it("acepta responsable válido sin observaciones y recorta espacios", () => {
    const res = emitirUnidadSchema.safeParse({
      responsable: "  Téc. Sofía Navarro  ",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.responsable).toBe("Téc. Sofía Navarro");
      expect(res.data.observaciones).toBeUndefined();
    }
  });

  it("acepta observaciones opcionales hasta 500 caracteres y normaliza vacío a undefined", () => {
    const vacias = emitirUnidadSchema.safeParse({
      responsable: "Téc. Sofía Navarro",
      observaciones: "   ",
    });
    expect(vacias.success).toBe(true);
    if (vacias.success) {
      expect(vacias.data.observaciones).toBeUndefined();
    }

    const validas = emitirUnidadSchema.safeParse({
      responsable: "Téc. Sofía Navarro",
      observaciones: "  Retira enfermería de UTI  ",
    });
    expect(validas.success).toBe(true);
    if (validas.success) {
      expect(validas.data.observaciones).toBe("Retira enfermería de UTI");
    }
  });

  it("rechaza responsable vacío, faltante o mayor a 120 caracteres", () => {
    expect(emitirUnidadSchema.safeParse({}).success).toBe(false);
    expect(emitirUnidadSchema.safeParse({ responsable: "   " }).success).toBe(false);
    expect(
      emitirUnidadSchema.safeParse({ responsable: "a".repeat(121) }).success,
    ).toBe(false);
  });

  it("rechaza observaciones mayores a 500 caracteres", () => {
    expect(
      emitirUnidadSchema.safeParse({
        responsable: "Téc. Sofía Navarro",
        observaciones: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
