import { describe, expect, it } from "vitest";
import { donacionSchema } from "./donacion";

describe("donacionSchema", () => {
  it("acepta una donación válida", () => {
    const resultado = donacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana Operadora",
      observaciones: "sin incidentes",
    });

    expect(resultado.success).toBe(true);
  });

  it("acepta la donación sin observaciones", () => {
    const resultado = donacionSchema.safeParse({
      donanteId: 3,
      operador: "Ana Operadora",
    });

    expect(resultado.success).toBe(true);
  });

  it("rechaza cuando no hay donante seleccionado", () => {
    const resultado = donacionSchema.safeParse({ operador: "Ana" });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe("Seleccioná un donante");
    }
  });

  it("rechaza un operador vacío", () => {
    const resultado = donacionSchema.safeParse({
      donanteId: 1,
      operador: "  ",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe("Campo obligatorio");
    }
  });

  it("rechaza un donanteId no positivo", () => {
    expect(
      donacionSchema.safeParse({ donanteId: 0, operador: "Ana" }).success,
    ).toBe(false);
  });
});
