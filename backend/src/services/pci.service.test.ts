import { describe, expect, it, vi } from "vitest";
import { create, buscarPorId, listar, type PciDb } from "./pci.service";

function fakeDb() {
  return {
    pci: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
  } as unknown as PciDb & {
    pci: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
}

const include = {
  resultados: { include: { antigeno: true } },
  donaciones: true,
};

describe("pci.service create", () => {
  it("crea el PCI con resultados y donaciones, y convierte la hora", async () => {
    const db = fakeDb();
    db.pci.create.mockResolvedValue({ id: 1 });

    await create(
      {
        fecha: new Date("2026-01-10T00:00:00.000Z"),
        hora: "08:30",
        observaciones: "",
        donacionIds: [1, 2],
        resultados: [
          { antigenoId: 3, resultado: "Positivo", intensidad: "fuerte" },
        ],
      } as never,
      db,
    );

    expect(db.pci.create).toHaveBeenCalledWith({
      data: {
        fecha: new Date("2026-01-10T00:00:00.000Z"),
        hora: new Date("1970-01-01T08:30:00.000Z"),
        observaciones: null,
        resultados: {
          create: [
            {
              antigenoId: 3,
              resultado: "Positivo",
              intensidad: "fuerte",
              observacion: null,
            },
          ],
        },
        donaciones: { create: [{ donacionId: 1 }, { donacionId: 2 }] },
      },
      include,
    });
  });
});

describe("pci.service buscarPorId", () => {
  it("delega en findUnique con el id y las relaciones", async () => {
    const db = fakeDb();
    db.pci.findUnique.mockResolvedValue({ id: 3 });

    const resultado = await buscarPorId(3, db);

    expect(db.pci.findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      include,
    });
    expect(resultado).toEqual({ id: 3 });
  });

  it("devuelve null si no existe", async () => {
    const db = fakeDb();
    db.pci.findUnique.mockResolvedValue(null);

    await expect(buscarPorId(404, db)).resolves.toBeNull();
  });
});

describe("pci.service listar", () => {
  it("filtra por donación cuando se pasa donacionId", async () => {
    const db = fakeDb();
    db.pci.findMany.mockResolvedValue([]);

    await listar({ donacionId: 7 }, db);

    expect(db.pci.findMany).toHaveBeenCalledWith({
      where: { donaciones: { some: { donacionId: 7 } } },
      include,
      orderBy: { fecha: "desc" },
    });
  });

  it("lista todo cuando no hay filtro", async () => {
    const db = fakeDb();
    db.pci.findMany.mockResolvedValue([]);

    await listar({}, db);

    expect(db.pci.findMany).toHaveBeenCalledWith({
      where: {},
      include,
      orderBy: { fecha: "desc" },
    });
  });
});
