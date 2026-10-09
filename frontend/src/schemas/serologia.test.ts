import { describe, expect, it } from "vitest";
import { serologiaFormSchema } from "./serologia";

const base = {
  fecha: "2026-01-10",
  hora: "14:05",
  resultados: [{ determinacionSerologicaId: 1, resultado: "No reactivo" }],
};

describe("serologiaFormSchema", () => {
  it("acepta una serología válida", () => {
    expect(serologiaFormSchema.safeParse(base).success).toBe(true);
  });

  it("acepta resultados con valor y unidad", () => {
    expect(
      serologiaFormSchema.safeParse({
        ...base,
        resultados: [
          {
            determinacionSerologicaId: 1,
            resultado: "Reactivo",
            valor: "1.2",
            unidad: "S/CO",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rechaza una hora con formato inválido", () => {
    expect(
      serologiaFormSchema.safeParse({ ...base, hora: "24:00" }).success,
    ).toBe(false);
  });

  it("rechaza la lista de resultados vacía", () => {
    expect(
      serologiaFormSchema.safeParse({ ...base, resultados: [] }).success,
    ).toBe(false);
  });

  it("rechaza un resultado sin determinación seleccionada", () => {
    const resultado = serologiaFormSchema.safeParse({
      ...base,
      resultados: [{ determinacionSerologicaId: 0, resultado: "Reactivo" }],
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe(
        "Seleccioná una determinación",
      );
    }
  });

  it("rechaza un resultado sin texto", () => {
    expect(
      serologiaFormSchema.safeParse({
        ...base,
        resultados: [
          { determinacionSerologicaId: 1, resultado: "  " },
        ],
      }).success,
    ).toBe(false);
  });
});
