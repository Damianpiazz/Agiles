import { describe, expect, it } from "vitest";
import { actualizarDonanteSchema } from "./donante";

const datosValidos = {
  domicilio: "Av. Pellegrini 1234",
  codigoPostal: "2000",
  email: "maria.gomez@example.com",
  telefonoFijo: "03414567890",
  telefonoCelular: "3415551234",
  operador: "Carlos Operador",
};

describe("actualizarDonanteSchema", () => {
  it("acepta datos válidos de domicilio, contacto y operador responsable", () => {
    expect(actualizarDonanteSchema.safeParse(datosValidos).success).toBe(true);
  });

  it("rechaza cuando faltan campos obligatorios", () => {
    const resultado = actualizarDonanteSchema.safeParse({
      ...datosValidos,
      domicilio: " ",
      codigoPostal: "",
      telefonoCelular: "",
      operador: " ",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors).toMatchObject({
        domicilio: ["Campo obligatorio"],
        codigoPostal: ["Campo obligatorio"],
        telefonoCelular: ["Campo obligatorio"],
        operador: ["Campo obligatorio"],
      });
    }
  });

  it("rechaza cuando el email es inválido", () => {
    const resultado = actualizarDonanteSchema.safeParse({
      ...datosValidos,
      email: "correo-invalido",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors).toMatchObject({
        email: ["Ingresá un email válido"],
      });
    }
  });
});
