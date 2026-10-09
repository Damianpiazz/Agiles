import { describe, expect, it } from "vitest";
import { pciFormSchema } from "./pci";

const base = {
  fecha: "2026-01-10",
  hora: "08:30",
  resultados: [{ antigenoId: 1, resultado: "Positivo" }],
};

describe("pciFormSchema", () => {
  it("acepta un PCI válido", () => {
    expect(pciFormSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza una hora con formato inválido", () => {
    expect(pciFormSchema.safeParse({ ...base, hora: "25:00" }).success).toBe(
      false,
    );
    expect(pciFormSchema.safeParse({ ...base, hora: "8:30" }).success).toBe(
      false,
    );
  });

  it("rechaza una fecha vacía", () => {
    expect(pciFormSchema.safeParse({ ...base, fecha: "" }).success).toBe(false);
  });

  it("rechaza la lista de resultados vacía", () => {
    expect(pciFormSchema.safeParse({ ...base, resultados: [] }).success).toBe(
      false,
    );
  });

  it("rechaza un resultado sin antígeno seleccionado", () => {
    const resultado = pciFormSchema.safeParse({
      ...base,
      resultados: [{ antigenoId: 0, resultado: "Positivo" }],
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe("Seleccioná un antígeno");
    }
  });

  it("rechaza un resultado sin texto", () => {
    expect(
      pciFormSchema.safeParse({
        ...base,
        resultados: [{ antigenoId: 1, resultado: "  " }],
      }).success,
    ).toBe(false);
  });
});
