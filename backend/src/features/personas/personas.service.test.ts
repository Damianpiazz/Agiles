import { describe, expect, it } from "vitest";
import { calcularSemaforo, clasificarResultado } from "./personas.service";

const fecha = new Date("2026-06-01T00:00:00.000Z");
const hora = new Date("1970-01-01T10:00:00.000Z");

function serologia(
  id: number,
  tipoMuestra: "PRIMERA" | "SEGUNDA",
  resultados: string[],
) {
  return {
    id,
    fecha,
    hora,
    tipoMuestra,
    resultados: resultados.map((resultado) => ({ resultado })),
  };
}

describe("clasificarResultado", () => {
  it("reconoce resultados no reactivos", () => {
    expect(clasificarResultado("No reactivo")).toBe("NO_REACTIVO");
    expect(clasificarResultado("Negativo")).toBe("NO_REACTIVO");
  });

  it("reconoce resultados reactivos y dudosos", () => {
    expect(clasificarResultado("Reactivo")).toBe("REACTIVO");
    expect(clasificarResultado("Positivo")).toBe("REACTIVO");
    expect(clasificarResultado("Dudoso")).toBe("DUDOSO");
  });
});

describe("calcularSemaforo", () => {
  it("devuelve gris cuando no hay estudios", () => {
    const semaforo = calcularSemaforo([]);
    expect(semaforo.estado).toBe("SIN_ESTUDIOS");
    expect(semaforo.color).toBe("GRIS");
  });

  it("marca rojo ante cualquier resultado reactivo", () => {
    const semaforo = calcularSemaforo([
      serologia(1, "PRIMERA", ["No reactivo", "Reactivo"]),
      serologia(2, "SEGUNDA", ["No reactivo"]),
    ]);
    expect(semaforo.estado).toBe("EXCLUIDO");
    expect(semaforo.color).toBe("ROJO");
  });

  it("marca amarillo cuando el último estudio es dudoso", () => {
    const semaforo = calcularSemaforo([serologia(1, "PRIMERA", ["Dudoso"])]);
    expect(semaforo.estado).toBe("REVISAR");
    expect(semaforo.color).toBe("AMARILLO");
  });

  it("marca verde cuando los estudios no tienen hallazgos", () => {
    const semaforo = calcularSemaforo([serologia(1, "PRIMERA", ["No reactivo"])]);
    expect(semaforo.estado).toBe("APTO");
    expect(semaforo.color).toBe("VERDE");
  });
});
