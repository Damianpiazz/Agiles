import { describe, expect, it } from "vitest";
import { pacienteSchema } from "./paciente";

const pacienteValido = {
  nombre: "Lucía",
  apellido: "Fernández",
  dni: "30111222",
  fechaNacimiento: "1990-04-15",
  operador: "Ana Operadora",
};

describe("pacienteSchema", () => {
  it("acepta los datos obligatorios del paciente y del operador", () => {
    expect(pacienteSchema.safeParse(pacienteValido).success).toBe(true);
  });

  it("rechaza datos de identificación incompletos", () => {
    const resultado = pacienteSchema.safeParse({
      ...pacienteValido,
      apellido: " ",
      dni: "",
      fechaNacimiento: "",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors).toMatchObject({
        apellido: ["Campo obligatorio"],
        dni: expect.any(Array),
        fechaNacimiento: ["Campo obligatorio"],
      });
    }
  });

  it("rechaza DNI inválido y fecha de nacimiento futura", () => {
    const resultado = pacienteSchema.safeParse({
      ...pacienteValido,
      dni: "12.345.678",
      fechaNacimiento: "2999-01-01",
    });

    expect(resultado.success).toBe(false);
  });
});
