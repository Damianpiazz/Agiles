import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/emisionUnidad.service", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    emitir: vi.fn(),
    listarPorUnidad: vi.fn(),
    listarPorSolicitud: vi.fn(),
  };
});

import * as svc from "../services/emisionUnidad.service";
import {
  emitir as emitirCtrl,
  listarPorSolicitud as listarPorSolicitudCtrl,
  listarPorUnidad as listarPorUnidadCtrl,
} from "./emisionUnidad.controller";

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

describe("emisionUnidad controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emitir responde 400 ante IDs inválidos", async () => {
    for (const [solicitudId, unidadId] of [
      ["0", "1"],
      ["1", "-2"],
      ["abc", "1"],
      ["1", "1.5"],
    ]) {
      const res = mockRes();
      await emitirCtrl(
        {
          params: { solicitudId, unidadId },
          body: { responsable: "Téc. Sofía" },
        } as any,
        res,
      );
      expect(res.statusCode).toBe(400);
    }
    expect(svc.emitir as any).not.toHaveBeenCalled();
  });

  it("emitir responde 400 con campos inválidos del cuerpo", async () => {
    const res = mockRes();
    await emitirCtrl(
      {
        params: { solicitudId: "10", unidadId: "50" },
        body: { responsable: "  ", observaciones: "x".repeat(501) },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.campos.responsable).toBeTruthy();
    expect(res.body.campos.observaciones).toBeTruthy();
    expect(svc.emitir as any).not.toHaveBeenCalled();
  });

  it("emitir responde 201 con emisión, unidad, etiqueta y advertencias", async () => {
    const respuesta = {
      emision: { id: 1 },
      unidad: { id: 50, estado: "EMITIDA" },
      etiqueta: { responsable: "Téc. Sofía" },
      advertencias: [],
    };
    (svc.emitir as any).mockResolvedValue(respuesta);
    const res = mockRes();

    await emitirCtrl(
      {
        params: { solicitudId: "10", unidadId: "50" },
        body: { responsable: "Téc. Sofía", observaciones: "Retira UTI" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(respuesta);
    expect(svc.emitir).toHaveBeenCalledWith(10, 50, {
      responsable: "Téc. Sofía",
      observaciones: "Retira UTI",
    });
  });

  it("emitir responde 404 cuando falta solicitud o unidad", async () => {
    for (const err of [
      new svc.SolicitudEmisionNoEncontradaError(),
      new svc.UnidadEmisionNoEncontradaError(),
    ]) {
      (svc.emitir as any).mockRejectedValueOnce(err);
      const res = mockRes();
      await emitirCtrl(
        {
          params: { solicitudId: "10", unidadId: "50" },
          body: { responsable: "Téc. Sofía" },
        } as any,
        res,
      );
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(err.message);
    }
  });

  it("emitir responde 409 ante todos los conflictos de negocio", async () => {
    const errores409 = [
      new svc.SolicitudNoAprobadaParaEmisionError("PENDIENTE"),
      new svc.SolicitudSinPacienteParaEmisionError(),
      new svc.UnidadNoReservadaParaEmisionError("La unidad está en estado DISPONIBLE."),
      new svc.UnidadNoPerteneceASolicitudError(),
      new svc.UnidadVencidaParaEmisionError(),
      new svc.UnidadIncompatibleParaEmisionError(),
      new svc.PruebaCruzadaIncompatibleError(),
    ];

    for (const err of errores409) {
      (svc.emitir as any).mockRejectedValueOnce(err);
      const res = mockRes();
      await emitirCtrl(
        {
          params: { solicitudId: "10", unidadId: "50" },
          body: { responsable: "Téc. Sofía" },
        } as any,
        res,
      );
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe(err.message);
    }
  });

  it("listarPorUnidad responde 400, 404 y 200 correctamente", async () => {
    const res400 = mockRes();
    await listarPorUnidadCtrl({ params: { id: "abc" } } as any, res400);
    expect(res400.statusCode).toBe(400);

    (svc.listarPorUnidad as any).mockRejectedValueOnce(
      new svc.UnidadEmisionNoEncontradaError(),
    );
    const res404 = mockRes();
    await listarPorUnidadCtrl({ params: { id: "99" } } as any, res404);
    expect(res404.statusCode).toBe(404);

    (svc.listarPorUnidad as any).mockResolvedValueOnce({
      unidad: { id: 50, estado: "EMITIDA" },
      emisiones: [{ id: 1 }],
    });
    const res200 = mockRes();
    await listarPorUnidadCtrl({ params: { id: "50" } } as any, res200);
    expect(res200.statusCode).toBe(200);
    expect(res200.body.emisiones).toHaveLength(1);
  });

  it("listarPorSolicitud responde 400, 404 y 200 correctamente", async () => {
    const res400 = mockRes();
    await listarPorSolicitudCtrl({ params: { solicitudId: "0" } } as any, res400);
    expect(res400.statusCode).toBe(400);

    (svc.listarPorSolicitud as any).mockRejectedValueOnce(
      new svc.SolicitudEmisionNoEncontradaError(),
    );
    const res404 = mockRes();
    await listarPorSolicitudCtrl({ params: { solicitudId: "99" } } as any, res404);
    expect(res404.statusCode).toBe(404);

    (svc.listarPorSolicitud as any).mockResolvedValueOnce({
      solicitud: { id: 10 },
      emisiones: [{ id: 1 }],
    });
    const res200 = mockRes();
    await listarPorSolicitudCtrl({ params: { solicitudId: "10" } } as any, res200);
    expect(res200.statusCode).toBe(200);
    expect(res200.body.solicitud.id).toBe(10);
  });
});
