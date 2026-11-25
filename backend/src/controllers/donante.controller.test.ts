import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as donanteService from "../services/donante.service";
import { darDeBaja, listar } from "./donante.controller";

vi.mock("../services/donante.service", () => ({
  DonanteNoEncontradoError: class DonanteNoEncontradoError extends Error {
    constructor() {
      super("Donante no encontrado");
    }
  },
  listarActivos: vi.fn(),
  darDeBaja: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  buscar: vi.fn(),
  buscarPorId: vi.fn(),
}));

const mockListarActivos = vi.mocked(donanteService.listarActivos);
const mockDarDeBaja = vi.mocked(donanteService.darDeBaja);

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

describe("donante.controller listar", () => {
  it("responde 200 con los donantes activos", async () => {
    const donantes = [{ id: 1, nombre: "Lucía", activo: true }];
    mockListarActivos.mockResolvedValue(donantes as never);
    const res = mockRes();

    await listar({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(donantes);
  });
});

describe("donante.controller darDeBaja", () => {
  it("responde 200 con el donante desactivado", async () => {
    const donante = { id: 3, activo: false };
    mockDarDeBaja.mockResolvedValue(donante as never);
    const res = mockRes();

    await darDeBaja({ params: { id: "3" } } as unknown as Request, res);

    expect(mockDarDeBaja).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(donante);
  });

  it("responde 404 cuando el donante no existe", async () => {
    mockDarDeBaja.mockRejectedValue(new donanteService.DonanteNoEncontradoError());
    const res = mockRes();

    await darDeBaja({ params: { id: "99" } } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("responde 400 cuando el id es inválido", async () => {
    const res = mockRes();

    await darDeBaja({ params: { id: "abc" } } as unknown as Request, res);

    expect(mockDarDeBaja).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
