import { describe, expect, it } from "vitest";
import { emitirUnidadFormSchema } from "./emisionUnidad";

describe("emitirUnidadFormSchema", () => {
  it("acepta responsable válido y normaliza observaciones vacías", () => {
    const res = emitirUnidadFormSchema.safeParse({
      responsable: "  Téc. Sofía Navarro  ",
      observaciones: "   ",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.responsable).toBe("Téc. Sofía Navarro");
      expect(res.data.observaciones).toBeUndefined();
    }
  });

  it("acepta observaciones opcionales válidas hasta 500 caracteres", () => {
    const res = emitirUnidadFormSchema.safeParse({
      responsable: "Téc. Sofía Navarro",
      observaciones: "  Retira enfermería de quirófano  ",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.observaciones).toBe("Retira enfermería de quirófano");
    }
  });

  it("rechaza responsable vacío o mayor a 120 caracteres y observaciones mayores a 500", () => {
    expect(
      emitirUnidadFormSchema.safeParse({ responsable: "   " }).success,
    ).toBe(false);
    expect(
      emitirUnidadFormSchema.safeParse({ responsable: "a".repeat(121) }).success,
    ).toBe(false);
    expect(
      emitirUnidadFormSchema.safeParse({
        responsable: "Téc. Sofía Navarro",
        observaciones: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
