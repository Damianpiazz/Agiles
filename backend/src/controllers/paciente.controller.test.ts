import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as pacienteService from "../services/paciente.service";
import { listar } from "./paciente.controller";

vi.mock("../services/paciente.service", () => ({
  create: vi.fn(),
  buscar: vi.fn(),
  listar: vi.fn(),
}));

const mockListar = vi.mocked(pacienteService.listar);

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn() };
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

describe("paciente.controller listar", () => {
  it("responde 200 con todos los pacientes y su cantidad de solicitudes", async () => {
    const pacientes = [
      {
        id: 1,
        nombre: "Ana",
        apellido: "Pérez",
        dni: "30111222",
        _count: { solicitudesTransfusion: 3 },
      },
    ];
    mockListar.mockResolvedValue(pacientes as never);
    const res = mockRes();

    await listar({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pacientes);
  });

  it("responde 500 cuando el servicio falla", async () => {
    mockListar.mockRejectedValue(new Error("falló"));
    const res = mockRes();

    await listar({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
