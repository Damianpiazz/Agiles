import { describe, expect, it } from "vitest";
import {
  obtenerFechaHoyArgentina,
  recepcionUnidadSchema,
} from "./recepcionUnidad";

describe("recepcionUnidadSchema", () => {
  it("acepta un formulario completo y válido", () => {
    const hoy = obtenerFechaHoyArgentina();
    const resultado = recepcionUnidadSchema.safeParse({
      numeroUnidad: "U-1001",
      tipoHemocomponente: "GLOBULOS_ROJOS",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      fechaVencimiento: hoy,
      estado: "DISPONIBLE",
      operador: "Laura Gómez",
    });

    expect(resultado.success).toBe(true);
  });

  it("rechaza cuando faltan datos obligatorios", () => {
    const resultado = recepcionUnidadSchema.safeParse({
      numeroUnidad: "",
      tipoHemocomponente: "",
      grupoABO: "",
      factorRhD: "",
      fechaVencimiento: "",
      estado: "",
      operador: "",
    });

    expect(resultado.success).toBe(false);
  });

  it("calcula la fecha actual usando America/Argentina/Buenos_Aires", () => {
    const instante = new Date("2026-10-31T01:30:00.000Z");
    expect(obtenerFechaHoyArgentina(instante)).toBe("2026-10-30");
  });

  it("rechaza una fecha de vencimiento anterior a hoy", () => {
    const resultado = recepcionUnidadSchema.safeParse({
      numeroUnidad: "U-1001",
      tipoHemocomponente: "PLASMA",
      grupoABO: "O",
      factorRhD: "NEGATIVO",
      fechaVencimiento: "2020-01-01",
      estado: "DISPONIBLE",
      operador: "Laura Gómez",
    });

    expect(resultado.success).toBe(false);
  });
});
