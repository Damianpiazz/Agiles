import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/bajaUnidad.service", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, darDeBaja: vi.fn() };
});

import * as svc from "../services/bajaUnidad.service";
import { darDeBaja as darDeBajaCtrl } from "./bajaUnidad.controller";

function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = vi.fn((c: number) => {
    res.statusCode = c;
    return res;
  });
  res.json = vi.fn((b: any) => {
    res.body = b;
    return res;
  });
  return res;
}

describe("bajaUnidad controller (S1, S4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 400 ante un identificador de unidad inválido", async () => {
    for (const id of ["0", "-1", "abc", "1.5", ""]) {
      const res = mockRes();
      await darDeBajaCtrl(
        { params: { id }, body: { motivo: "VENCIDA", operador: "Ana" } } as any,
        res,
      );
      expect(res.statusCode).toBe(400);
    }
    expect(svc.darDeBaja as any).not.toHaveBeenCalled();
  });

  it("responde 400 con los campos inválidos del cuerpo", async () => {
    const res = mockRes();
    await darDeBajaCtrl(
      {
        params: { id: "1" },
        body: { motivo: "ROTA", operador: "" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.campos.motivo).toBeTruthy();
    expect(res.body.campos.operador).toBeTruthy();
  });

  it("responde 200 con la unidad dada de baja (S1)", async () => {
    (svc.darDeBaja as any).mockResolvedValue({
      id: 1,
      estado: "DADA_DE_BAJA",
    });
    const res = mockRes();

    await darDeBajaCtrl(
      {
        params: { id: "1" },
        body: { motivo: "VENCIDA", operador: "Ana" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe("DADA_DE_BAJA");
  });

  it("responde 404 cuando la unidad no existe", async () => {
    (svc.darDeBaja as any).mockRejectedValue(
      new svc.UnidadNoEncontradaError(),
    );
    const res = mockRes();

    await darDeBajaCtrl(
      {
        params: { id: "99" },
        body: { motivo: "VENCIDA", operador: "Ana" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("La unidad de sangre no existe.");
  });

  it("responde 409 cuando la unidad ya fue dada de baja (S4)", async () => {
    (svc.darDeBaja as any).mockRejectedValue(
      new svc.UnidadYaDadaDeBajaError(),
    );
    const res = mockRes();

    await darDeBajaCtrl(
      {
        params: { id: "1" },
        body: { motivo: "VENCIDA", operador: "Ana" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("La unidad ya fue dada de baja.");
  });
});
