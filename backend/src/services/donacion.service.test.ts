import { describe, expect, it, vi } from "vitest";
import {
  create,
  buscarPorId,
  EntrevistaPendienteNoEncontradaError,
  DonanteNoEncontradoError,
  type DonacionDb,
} from "./donacion.service";

function fakeDb(): DonacionDb & {
  donante: { findUnique: ReturnType<typeof vi.fn> };
  donacion: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  entrevistaPreDonacion: {
    findFirst: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
} {
  const tx = {
    donante: { findUnique: vi.fn() },
    donacion: { create: vi.fn(), findUnique: vi.fn() },
    entrevistaPreDonacion: {
      findFirst: vi.fn().mockResolvedValue({
        id: 20,
        donacionId: null,
        resultadoAdmision: "ADMITIDO",
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  return {
    ...tx,
    $transaction: vi.fn((callback) => callback(tx)),
  } as unknown as DonacionDb & {
    donante: { findUnique: ReturnType<typeof vi.fn> };
    donacion: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    entrevistaPreDonacion: {
      findFirst: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
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
    expect(db.entrevistaPreDonacion.findFirst).toHaveBeenCalledWith({
      where: { donanteId: 1 },
      orderBy: { createdAt: "desc" },
      select: { id: true, donacionId: true, resultadoAdmision: true },
    });
    expect(db.donacion.create).toHaveBeenCalledWith({
      data: {
        donanteId: 1,
        operador: "Ana",
        peso: null,
        tensionArterial: null,
        hemoglobina: null,
        voluntario: false,
        reposicion: false,
        autoExcluido: false,
        observaciones: null,
      },
    });
    expect(db.entrevistaPreDonacion.updateMany).toHaveBeenCalledWith({
      where: { id: 20, donacionId: null },
      data: { donacionId: 10 },
    });
    expect(resultado).toEqual({
      id: 10,
      donanteId: 1,
      estado: "REGISTRADA",
      entrevistaId: 20,
    });
  });

  it("guarda null cuando las observaciones vienen vacías", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({ id: 1 });
    db.donacion.create.mockResolvedValue({ id: 11 });

    await create(
      {
        donanteId: 1,
        operador: "Ana",
        observaciones: "",
        voluntario: false,
        reposicion: false,
        autoExcluido: false,
      },
      db,
    );

    expect(db.donacion.create).toHaveBeenCalledWith({
      data: {
        donanteId: 1,
        operador: "Ana",
        peso: null,
        tensionArterial: null,
        hemoglobina: null,
        voluntario: false,
        reposicion: false,
        autoExcluido: false,
        observaciones: null,
      },
    });
  });

  it("persiste los datos clínicos y las banderas cuando vienen presentes", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({ id: 1 });
    db.donacion.create.mockResolvedValue({ id: 12 });

    await create(
      {
        donanteId: 1,
        operador: "Ana",
        peso: "78",
        tensionArterial: "120/80",
        hemoglobina: "14.5",
        voluntario: true,
        reposicion: true,
        autoExcluido: true,
      },
      db,
    );

    expect(db.donacion.create).toHaveBeenCalledWith({
      data: {
        donanteId: 1,
        operador: "Ana",
        peso: "78",
        tensionArterial: "120/80",
        hemoglobina: "14.5",
        voluntario: true,
        reposicion: true,
        autoExcluido: true,
        observaciones: null,
      },
    });
  });

  it("reenvía la fechaHora cuando viene presente", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({ id: 1 });
    db.donacion.create.mockResolvedValue({ id: 13 });
    const fecha = new Date("2026-01-10T08:30:00.000Z");

    await create(
      {
        donanteId: 1,
        operador: "Ana",
        voluntario: false,
        reposicion: false,
        autoExcluido: false,
        fechaHora: fecha,
      },
      db,
    );

    expect(db.donacion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ fechaHora: fecha }),
    });
  });

  it("lanza DonanteNoEncontradoError y no crea nada cuando el donante no existe", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue(null);

    await expect(
      create(
        {
          donanteId: 99,
          operador: "Ana",
          voluntario: false,
          reposicion: false,
          autoExcluido: false,
        },
        db,
      ),
    ).rejects.toBeInstanceOf(DonanteNoEncontradoError);

    expect(db.donacion.create).not.toHaveBeenCalled();
  });

  it("no crea la donación si no hay entrevista admitida pendiente", async () => {
    const db = fakeDb();
    db.donante.findUnique.mockResolvedValue({ id: 1 });
    db.entrevistaPreDonacion.findFirst.mockResolvedValue(null);

    await expect(
      create({ donanteId: 1, operador: "Ana" } as never, db),
    ).rejects.toBeInstanceOf(EntrevistaPendienteNoEncontradaError);

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
