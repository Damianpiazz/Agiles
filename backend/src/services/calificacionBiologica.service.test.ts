import { describe, expect, it, vi } from "vitest";
import {
  iniciar,
  DonacionBloqueadaError,
  DonacionNoEncontradaError,
} from "./calificacionBiologica.service";

function fakeDb(estado: string | null) {
  return {
    donacion: {
      findUnique: vi.fn().mockResolvedValue(
        estado === null ? null : { id: 3, estado },
      ),
    },
    calificacionBiologica: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe("calificacionBiologica.service iniciar", () => {
  it("no permite iniciar la calificación de una donación bloqueada", async () => {
    const db = fakeDb("RECHAZADA");

    await expect(iniciar(3, "Operador", db as never)).rejects.toBeInstanceOf(
      DonacionBloqueadaError,
    );
    expect(db.calificacionBiologica.findUnique).not.toHaveBeenCalled();
    expect(db.calificacionBiologica.create).not.toHaveBeenCalled();
  });

  it("informa cuando la donación no existe", async () => {
    const db = fakeDb(null);

    await expect(iniciar(404, "Operador", db as never)).rejects.toBeInstanceOf(
      DonacionNoEncontradaError,
    );
    expect(db.calificacionBiologica.create).not.toHaveBeenCalled();
  });
});
