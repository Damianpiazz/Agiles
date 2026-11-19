import { describe, expect, it, vi } from "vitest";
import {
  consultarPorDni,
  DonanteNoEncontradoError,
  type ConsultaResultadosDb,
} from "./consultaResultados.service";

function fakeDb() {
  return {
    donante: {
      findUnique: vi.fn<(args: any) => Promise<any>>(),
    },
  };
}

describe("consultaResultados.service", () => {
  it("busca un donante por DNI e incluye sus donaciones y resultados", async () => {
    const db = fakeDb();

    const donanteEsperado = {
      id: 1,
      nombre: "Juan",
      apellido: "Pérez",
      dni: "30111222",
      donaciones: [],
    };

    db.donante.findUnique.mockResolvedValue(donanteEsperado);

    const resultado = await consultarPorDni(
      "30111222",
      db as ConsultaResultadosDb,
    );

    expect(db.donante.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dni: "30111222" },
        select: expect.objectContaining({
          id: true,
          dni: true,
          donaciones: expect.any(Object),
        }),
      }),
    );

    expect(resultado).toEqual(donanteEsperado);
  });

  it("ordena las donaciones por fecha cronológica ascendente", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({
      id: 1,
      donaciones: [],
    });

    await consultarPorDni("30111222", db as ConsultaResultadosDb);

    const consulta = db.donante.findUnique.mock.calls[0][0];

    expect(consulta.select.donaciones.orderBy).toEqual({
      fechaHora: "asc",
    });
  });

  it("lanza DonanteNoEncontradoError si el DNI no existe", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue(null);

    await expect(
      consultarPorDni("99999999", db as ConsultaResultadosDb),
    ).rejects.toBeInstanceOf(DonanteNoEncontradoError);
  });
});