import { describe, expect, it, vi } from "vitest";
import {
  create,
  buscarPorId,
  DonanteNoEncontradoError,
  type DonacionDb,
} from "./donacion.service";

function fakeDb(): DonacionDb & {
  donante: { findUnique: ReturnType<typeof vi.fn> };
  donacion: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
} {
  return {
    donante: { findUnique: vi.fn() },
    donacion: { create: vi.fn(), findUnique: vi.fn() },
  } as unknown as DonacionDb & {
    donante: { findUnique: ReturnType<typeof vi.fn> };
    donacion: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
}

describe("donacion.service create", () => {
  it("crea la donación cuando el donante existe", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({ id: 1, nombre: "Juan" });
    db.donacion.create.mockResolvedValue({ id: 10, donanteId: 1, estado: "REGISTRADA" });

    const resultado = await create(
      { donanteId: 1, operador: "Ana" } as never,
      db,
    );

    expect(db.donante.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(db.donacion.create).toHaveBeenCalledWith({
      data: { donanteId: 1, operador: "Ana", observaciones: null },
    });
    expect(resultado).toEqual({ id: 10, donanteId: 1, estado: "REGISTRADA" });
  });

  it("guarda null cuando las observaciones vienen vacías", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({ id: 1 });
    db.donacion.create.mockResolvedValue({ id: 11 });

    await create({ donanteId: 1, operador: "Ana", observaciones: "" }, db);

    expect(db.donacion.create).toHaveBeenCalledWith({
      data: { donanteId: 1, operador: "Ana", observaciones: null },
    });
  });

  it("lanza DonanteNoEncontradoError y no crea nada cuando el donante no existe", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue(null);

    await expect(
      create({ donanteId: 99, operador: "Ana" }, db),
    ).rejects.toBeInstanceOf(DonanteNoEncontradoError);

    expect(db.donacion.create).not.toHaveBeenCalled();
  });
});

describe("donacion.service buscarPorId", () => {
  it("delega en findUnique con el id recibido", async () => {
    const db = fakeDb();
    db.donacion.findUnique.mockResolvedValue({ id: 3 });

    const resultado = await buscarPorId(3, db);

    expect(db.donacion.findUnique).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(resultado).toEqual({ id: 3 });
  });

  it("devuelve null si no encuentra la donación", async () => {
    const db = fakeDb();
    db.donacion.findUnique.mockResolvedValue(null);

    await expect(buscarPorId(404, db)).resolves.toBeNull();
  });
});
