import { describe, expect, it } from "vitest";
import { buscarPacienteSchema, crearPacienteSchema } from "./paciente.types";

const pacienteValido = {
  nombre: "Lucía",
  apellido: "Fernández",
  dni: "30111222",
  fechaNacimiento: "1990-04-15",
  operador: "Ana Operadora",
};

describe("crearPacienteSchema", () => {
  it("acepta los datos requeridos para identificar y auditar al paciente", () => {
    const resultado = crearPacienteSchema.safeParse(pacienteValido);

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.fechaNacimiento).toBeInstanceOf(Date);
      expect(resultado.data.operador).toBe("Ana Operadora");
    }
  });

  it("rechaza datos de identificación y operador incompletos", () => {
    const resultado = crearPacienteSchema.safeParse({
      ...pacienteValido,
      apellido: " ",
      dni: "",
      operador: "",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors).toMatchObject({
        apellido: ["Obligatorio"],
        dni: expect.any(Array),
        operador: ["El operador es obligatorio"],
      });
    }
  });

  it("rechaza DNI inválido y fecha de nacimiento futura", () => {
    const resultado = crearPacienteSchema.safeParse({
      ...pacienteValido,
      dni: "12.345.678",
      fechaNacimiento: "2999-01-01",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("buscarPacienteSchema", () => {
  it("permite listar pacientes sin filtros para reutilizarlos en solicitudes", () => {
    expect(buscarPacienteSchema.safeParse({}).success).toBe(true);
  });

  it("valida los criterios de búsqueda", () => {
    expect(buscarPacienteSchema.safeParse({ dni: "30111222" }).success).toBe(
      true,
    );
    expect(buscarPacienteSchema.safeParse({ dni: "30.111.222" }).success).toBe(
      false,
    );
  });
});
