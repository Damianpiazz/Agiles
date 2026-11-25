import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as service from "../services/personaHistorial.service";
import { consultar } from "./personaHistorial.controller";

vi.mock("../services/personaHistorial.service", () => ({
  consultar: vi.fn(),
  DniInvalidoError: class DniInvalidoError extends Error {},
}));

const mockConsultar = vi.mocked(service.consultar);

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

describe("personaHistorial.controller consultar", () => {
  it("responde 200 con la historia de la persona", async () => {
    const historia = { dni: "30111222", resumen: { esDonante: true } };
    mockConsultar.mockResolvedValue(historia as never);
    const res = mockRes();

    await consultar({ params: { dni: "30111222" } } as unknown as Request, res);

    expect(mockConsultar).toHaveBeenCalledWith("30111222");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(historia);
  });

  it("responde 400 para un DNI inválido", async () => {
    const res = mockRes();

    await consultar({ params: { dni: "abc" } } as unknown as Request, res);

    expect(mockConsultar).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
