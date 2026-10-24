
import { describe, expect, it, vi } from "vitest";
import {
  crear,
  buscarPorId,
  listarPorDonacion,
  DonacionNoEncontradaError,
} from "./tipificacionSanguinea.service";
import type { CrearTipificacionSanguineaInput } from "../types/tipificacionSanguinea.types";

function fakeDb() {
  return {
    donacion: {
      findUnique: vi.fn(),
    },
    tipificacionSanguinea: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

const datosValidos: CrearTipificacionSanguineaInput = {
  donacionId: 5,
  grupoABO: "A",
  factorRhD: "POSITIVO",
  operador: "Operador de prueba",
};

const include = {
  donacion: {
    include: {
      donante: true,
    },
  },
};

describe("tipificacionSanguinea.service crear", () => {
  it("registra la tipificación asociada a una donación existente", async () => {
    const db = fakeDb();
    db.donacion.findUnique.mockResolvedValue({ id: 5 });
    db.tipificacionSanguinea.create.mockResolvedValue({
      id: 1,
      ...datosValidos,
    });

    const resultado = await crear(datosValidos, db);

    expect(db.donacion.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
    });

    expect(db.tipificacionSanguinea.create).toHaveBeenCalledWith({
      data: {
        donacionId: 5,
        grupoABO: "A",
        factorRhD: "POSITIVO",
        operador: "Operador de prueba",
      },
      include,
    });

    expect(resultado).toMatchObject({
      id: 1,
      grupoABO: "A",
      factorRhD: "POSITIVO",
    });
  });

  it("lanza un error si la donación no existe", async () => {
    const db = fakeDb();
    db.donacion.findUnique.mockResolvedValue(null);

    await expect(crear(datosValidos, db)).rejects.toBeInstanceOf(
      DonacionNoEncontradaError,
    );

    expect(db.tipificacionSanguinea.create).not.toHaveBeenCalled();
  });
});

describe("tipificacionSanguinea.service buscarPorId", () => {
  it("consulta por ID e incluye la donación y el donante", async () => {
    const db = fakeDb();
    db.tipificacionSanguinea.findUnique.mockResolvedValue({ id: 1 });

    const resultado = await buscarPorId(1, db);

    expect(db.tipificacionSanguinea.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include,
    });
    expect(resultado).toEqual({ id: 1 });
  });

  it("devuelve null cuando la tipificación no existe", async () => {
    const db = fakeDb();
    db.tipificacionSanguinea.findUnique.mockResolvedValue(null);

    await expect(buscarPorId(404, db)).resolves.toBeNull();
  });
});

describe("tipificacionSanguinea.service listarPorDonacion", () => {
  it("lista las tipificaciones de una donación, de más reciente a más antigua", async () => {
    const db = fakeDb();
    db.tipificacionSanguinea.findMany.mockResolvedValue([]);

    await listarPorDonacion(5, db);

    expect(db.tipificacionSanguinea.findMany).toHaveBeenCalledWith({
      where: { donacionId: 5 },
      orderBy: { fechaHora: "desc" },
    });
  });
});
