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

  it("acepta los datos clínicos y las banderas", () => {
    const resultado = donacionSchema.safeParse({
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
      expect(resultado.data.voluntario).toBe(true);
      expect(resultado.data.autoExcluido).toBe(false);
    }
  });

  it("aplica false por defecto a las banderas", () => {
    const resultado = donacionSchema.safeParse({
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

  it("acepta la fecha y hora de la extracción", () => {
    const resultado = donacionSchema.safeParse({
      donanteId: 1,
      operador: "Ana",
      fechaHora: "2026-01-10T08:30:00.000Z",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.fechaHora).toBe("2026-01-10T08:30:00.000Z");
    }
  });
});
