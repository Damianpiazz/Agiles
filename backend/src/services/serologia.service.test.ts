import { describe, expect, it, vi } from "vitest";
import {
  create,
  buscarPorId,
  listar,
  type SerologiaDb,
} from "./serologia.service";

function fakeDb() {
  return {
    serologia: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  } as unknown as SerologiaDb & {
    serologia: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
}

const include = {
  resultados: { include: { determinacionSerologica: true } },
  donaciones: true,
};

describe("serologia.service create", () => {
  it("crea la serología con resultados y donaciones, y convierte la hora", async () => {
    const db = fakeDb();
    db.serologia.create.mockResolvedValue({ id: 1 });

    await create(
      {
        fecha: new Date("2026-01-10T00:00:00.000Z"),
        hora: "14:05",
        donacionIds: [5],
        resultados: [
          {
            determinacionSerologicaId: 2,
            resultado: "No reactivo",
            unidad: "UI/mL",
          },
        ],
      } as never,
      db,
    );

    expect(db.serologia.create).toHaveBeenCalledWith({
      data: {
        fecha: new Date("2026-01-10T00:00:00.000Z"),
        hora: new Date("1970-01-01T14:05:00.000Z"),
        observaciones: null,
        resultados: {
          create: [
            {
              determinacionSerologicaId: 2,
              resultado: "No reactivo",
              valor: null,
              unidad: "UI/mL",
              observacion: null,
            },
          ],
        },
        donaciones: { create: [{ donacionId: 5 }] },
      },
      include,
    });
  });
});

describe("serologia.service buscarPorId", () => {
  it("delega en findUnique con el id y las relaciones", async () => {
    const db = fakeDb();
    db.serologia.findUnique.mockResolvedValue({ id: 3 });

    const resultado = await buscarPorId(3, db);

    expect(db.serologia.findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      include,
    });
    expect(resultado).toEqual({ id: 3 });
  });

  it("devuelve null si no existe", async () => {
    const db = fakeDb();
    db.serologia.findUnique.mockResolvedValue(null);

    await expect(buscarPorId(404, db)).resolves.toBeNull();
  });
});

describe("serologia.service listar", () => {
  it("filtra por donación cuando se pasa donacionId", async () => {
    const db = fakeDb();
    db.serologia.findMany.mockResolvedValue([]);

    await listar({ donacionId: 7 }, db);

    expect(db.serologia.findMany).toHaveBeenCalledWith({
      where: { donaciones: { some: { donacionId: 7 } } },
      include,
      orderBy: { fecha: "desc" },
    });
  });

  it("lista todo cuando no hay filtro", async () => {
    const db = fakeDb();
    db.serologia.findMany.mockResolvedValue([]);

    await listar({}, db);

    expect(db.serologia.findMany).toHaveBeenCalledWith({
      where: {},
      include,
      orderBy: { fecha: "desc" },
    });
  });
});
