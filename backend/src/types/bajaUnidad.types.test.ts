import { describe, expect, it } from "vitest";
import { darDeBajaUnidadSchema } from "./bajaUnidad.types";

describe("darDeBajaUnidadSchema límites (S2)", () => {
  it("acepta exactamente VENCIDA, TRANSFUNDIDA y DESCARTADA", () => {
    for (const motivo of ["VENCIDA", "TRANSFUNDIDA", "DESCARTADA"] as const) {
      expect(
        darDeBajaUnidadSchema.safeParse({ motivo, operador: "A" }).success,
      ).toBe(true);
    }
  });

  it("rechaza un motivo en minúsculas, desconocido, vacío o con espacios", () => {
    for (const motivo of ["vencida", "ROTA", "", undefined, "VENCIDA "]) {
      expect(
        darDeBajaUnidadSchema.safeParse({ motivo, operador: "A" }).success,
      ).toBe(false);
    }
  });

  it("exige un operador de 1 a 120 caracteres después de recortar", () => {
    expect(
      darDeBajaUnidadSchema.safeParse({ motivo: "VENCIDA", operador: "   " })
        .success,
    ).toBe(false);
    expect(
      darDeBajaUnidadSchema.safeParse({
        motivo: "VENCIDA",
        operador: "x".repeat(120),
      }).success,
    ).toBe(true);
    expect(
      darDeBajaUnidadSchema.safeParse({
        motivo: "VENCIDA",
        operador: "x".repeat(121),
      }).success,
    ).toBe(false);
  });
});
