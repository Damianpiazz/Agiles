import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as donacionService from "../services/donacion.service";
import { create, getById } from "./donacion.controller";

vi.mock("../services/donacion.service", () => {
  class DonanteNoEncontradoError extends Error {
    constructor() {
      super("El donante no existe");
    }
  }

  return {
    DonanteNoEncontradoError,
    create: vi.fn(),
    buscarPorId: vi.fn(),
  };
});

const mockCreate = vi.mocked(donacionService.create);
const mockBuscarPorId = vi.mocked(donacionService.buscarPorId);

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("donacion.controller create", () => {
  it("responde 201 con la donación creada", async () => {
    mockCreate.mockResolvedValue({ id: 1, estado: "REGISTRADA" } as never);
    const res = mockRes();

    await create(
      { body: { donanteId: 1, operador: "Ana" } } as Request,
      res,
    );

    expect(mockCreate).toHaveBeenCalledWith({ donanteId: 1, operador: "Ana" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, estado: "REGISTRADA" });
  });

  it("responde 400 con el detalle de los campos cuando el body es inválido", async () => {
    const res = mockRes();

    await create({ body: { operador: "" } } as Request, res);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0]?.[0];
    expect(payload.error).toBe("Datos inválidos");
    expect(payload.campos).toBeDefined();
  });

  it("responde 404 cuando el donante no existe", async () => {
    mockCreate.mockRejectedValue(new donacionService.DonanteNoEncontradoError());
    const res = mockRes();

    await create(
      { body: { donanteId: 99, operador: "Ana" } } as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "El donante no existe" });
  });

  it("responde 500 ante un error inesperado", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));
    const res = mockRes();

    await create(
      { body: { donanteId: 1, operador: "Ana" } } as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error interno" });
  });
});

describe("donacion.controller getById", () => {
  it("responde 200 cuando encuentra la donación", async () => {
    mockBuscarPorId.mockResolvedValue({ id: 5 } as never);
    const res = mockRes();

    await getById({ params: { id: "5" } } as unknown as Request, res);

    expect(mockBuscarPorId).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 5 });
  });

  it("responde 400 cuando el id es inválido", async () => {
    const res = mockRes();

    await getById({ params: { id: "abc" } } as unknown as Request, res);

    expect(mockBuscarPorId).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("responde 404 cuando no existe la donación", async () => {
    mockBuscarPorId.mockResolvedValue(null);
    const res = mockRes();

    await getById({ params: { id: "404" } } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Donación no encontrada" });
  });
});
