import { describe, expect, it, vi } from "vitest";
import {
  CalificacionBiologicaNoIniciadaError,
  DonacionNoEncontradaError,
  registrarResultado,
} from "./anticuerpoIrregular.service";

function fakeDb({
  donacion = { id: 3, estado: "EN_CALIFICACION", donante: { id: 12 } },
  calificacion = { id: 5, donacionId: 3 },
  registro = null,
}: {
  donacion?: any;
  calificacion?: any;
  registro?: any;
} = {}) {
  return {
    donacion: {
      findUnique: vi.fn().mockResolvedValue(donacion),
    },
    calificacionBiologica: {
      findUnique: vi.fn().mockResolvedValue(calificacion),
    },
    anticuerpoIrregular: {
      upsert: vi.fn().mockResolvedValue(
        registro ?? {
          id: 1,
          donacionId: 3,
          resultado: "POSITIVO",
          operador: "Operador",
          observacion: "Revisión",
          donacion: {
            donante: { id: 12 },
          },
        },
      ),
    },
  };
}

describe("anticuerpoIrregular.service registrarResultado", () => {
  it("requiere una donación existente", async () => {
    const db = fakeDb({ donacion: null });

    await expect(
      registrarResultado({ donacionId: 999, resultado: "NEGATIVO", operador: "Operador", observacion: undefined }, db as never),
    ).rejects.toBeInstanceOf(DonacionNoEncontradaError);
  });

  it("requiere una calificación iniciada", async () => {
    const db = fakeDb({ calificacion: null });

    await expect(
      registrarResultado({ donacionId: 3, resultado: "NEGATIVO", operador: "Operador", observacion: undefined }, db as never),
    ).rejects.toBeInstanceOf(CalificacionBiologicaNoIniciadaError);
  });

  it("devuelve advertencias cuando el resultado es positivo", async () => {
    const db = fakeDb();

    const response = await registrarResultado(
      { donacionId: 3, resultado: "POSITIVO", operador: "Operador", observacion: undefined },
      db as never,
    );

    expect(response.etiquetaComponente).toBe("con anticuerpos irregulares");
    expect(response.advertenciaPlasma).toContain("componentes plasmáticos");
    expect(response.notificacionDonante).toContain("notificar al donante");
  });
});
