import { describe, expect, it } from "vitest";
import { actualizarDonanteSchema } from "./donante.types";

const datosValidos = {
  domicilio: "Av. Pellegrini 1234",
  codigoPostal: "2000",
  email: "maria.gomez@example.com",
  telefonoFijo: "03414567890",
  telefonoCelular: "3415551234",
  operador: "Carlos Operador",
};

describe("actualizarDonanteSchema", () => {
  it("acepta los datos de domicilio, contacto y el operador responsable", () => {
    const resultado = actualizarDonanteSchema.safeParse(datosValidos);

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.domicilio).toBe("Av. Pellegrini 1234");
      expect(resultado.data.operador).toBe("Carlos Operador");
    }
  });

  it("rechaza cuando faltan campos obligatorios", () => {
    const resultado = actualizarDonanteSchema.safeParse({
      ...datosValidos,
      domicilio: " ",
      codigoPostal: "",
      telefonoCelular: "",
      operador: "   ",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors).toMatchObject({
        domicilio: ["Obligatorio"],
        codigoPostal: ["Obligatorio"],
        telefonoCelular: ["Obligatorio"],
        operador: ["El operador es obligatorio"],
      });
    }
  });

  it("rechaza cuando el email es inválido", () => {
    const resultado = actualizarDonanteSchema.safeParse({
      ...datosValidos,
      email: "email-invalido",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors).toMatchObject({
        email: ["Email inválido"],
      });
    }
  });
});
