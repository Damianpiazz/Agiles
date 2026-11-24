import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/solicitudTransfusion.service", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, aprobar: vi.fn() };
});

import * as svc from "../services/solicitudTransfusion.service";
import { aprobar as aprobarCtrl } from "./solicitudTransfusion.controller";

function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: any) => {
    res.body = body;
    return res;
  });
  return res;
}

describe("solicitudTransfusion controller - aprobar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 400 ante un ID de solicitud inválido", async () => {
    for (const solicitudId of ["0", "-1", "abc", "1.5", ""]) {
      const res = mockRes();
      await aprobarCtrl(
        {
          params: { solicitudId },
          body: { operador: "Dra. Laura Méndez" },
        } as any,
        res,
      );
      expect(res.statusCode).toBe(400);
    }
    expect(svc.aprobar as any).not.toHaveBeenCalled();
  });

  it("responde 400 con los campos inválidos del cuerpo", async () => {
    const res = mockRes();
    await aprobarCtrl(
      {
        params: { solicitudId: "10" },
        body: { operador: "   ", opinionMedica: "x".repeat(1001) },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.campos.operador).toBeTruthy();
    expect(res.body.campos.opinionMedica).toBeTruthy();
    expect(svc.aprobar as any).not.toHaveBeenCalled();
  });

  it("responde 404 cuando la solicitud no existe", async () => {
    (svc.aprobar as any).mockRejectedValue(
      new svc.SolicitudTransfusionNoEncontradaError(),
    );
    const res = mockRes();

    await aprobarCtrl(
      {
        params: { solicitudId: "99" },
        body: { operador: "Dra. Laura Méndez" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("La solicitud de transfusión no existe.");
  });

  it("responde 409 cuando la solicitud ya está aprobada, cancelada o sin paciente", async () => {
    const errores = [
      new svc.SolicitudTransfusionYaAprobadaError(),
      new svc.SolicitudTransfusionCanceladaError(
        "La solicitud está cancelada y no puede aprobarse.",
      ),
      new svc.SolicitudTransfusionSinPacienteError(),
    ];

    for (const err of errores) {
      (svc.aprobar as any).mockRejectedValueOnce(err);
      const res = mockRes();
      await aprobarCtrl(
        {
          params: { solicitudId: "10" },
          body: { operador: "Dra. Laura Méndez" },
        } as any,
        res,
      );
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe(err.message);
    }
  });

  it("responde 200 con la solicitud aprobada", async () => {
    const solicitudAprobada = {
      id: 10,
      estado: "APROBADA",
      aprobadaPor: "Dra. Laura Méndez",
      opinionMedica: "Indicación adecuada",
    };
    (svc.aprobar as any).mockResolvedValue(solicitudAprobada);
    const res = mockRes();

    await aprobarCtrl(
      {
        params: { solicitudId: "10" },
        body: {
          operador: "Dra. Laura Méndez",
          opinionMedica: "Indicación adecuada",
        },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(solicitudAprobada);
    expect(svc.aprobar).toHaveBeenCalledWith(10, {
      operador: "Dra. Laura Méndez",
      opinionMedica: "Indicación adecuada",
    });
  });
});
