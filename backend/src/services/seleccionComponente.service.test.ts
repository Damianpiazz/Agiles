import { describe, expect, it, vi } from "vitest";
import {
  SolicitudNoAprobadaError,
  SolicitudNoEncontradaError,
  UnidadNoCompatibleError,
  UnidadNoDisponibleError,
  esUnidadCompatible,
  listarUnidadesCompatibles,
  listarUnidadesReservadas,
  reservarUnidad,
} from "./seleccionComponente.service";

function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + cantidad);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function solicitudAprobada() {
  return {
    id: 7,
    dniPaciente: "30111222",
    nombrePaciente: "Lucía Fernández",
    grupoABO: "A",
    factorRhD: "POSITIVO",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    cantidad: 2,
    estado: "APROBADA",
    operador: "Operador",
    fechaHora: new Date(),
  };
}

function unidad(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    numeroUnidad: "U-1001",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    grupoABO: "A",
    factorRhD: "POSITIVO",
    fechaVencimiento: enDias(20),
    estado: "DISPONIBLE",
    solicitudId: null,
    reservadaPor: null,
    reservadaEn: null,
    ...overrides,
  };
}

function fakeDb({
  solicitud = solicitudAprobada() as any,
  unidades = [] as any[],
  resultadoReserva = { count: 1 },
  unidadReservada = null as any,
}: {
  solicitud?: any;
  unidades?: any[];
  resultadoReserva?: { count: number };
  unidadReservada?: any;
} = {}) {
  return {
    solicitudTransfusion: {
      findUnique: vi.fn().mockResolvedValue(solicitud),
      findMany: vi.fn().mockResolvedValue(solicitud ? [solicitud] : []),
    },
    unidadSangre: {
      findMany: vi.fn().mockResolvedValue(unidades),
      // Primera llamada: unidad en inventario. Segunda: unidad tras la reserva.
      findUnique: vi
        .fn()
        .mockResolvedValueOnce(unidades[0] ?? null)
        .mockResolvedValue(unidadReservada ?? unidades[0] ?? null),
      updateMany: vi.fn().mockResolvedValue(resultadoReserva),
    },
  };
}

describe("seleccionComponente.service esUnidadCompatible", () => {
  it("acepta el mismo grupo ABO y Rh", () => {
    expect(
      esUnidadCompatible(unidad() as any, {
        grupoABO: "A",
        factorRhD: "POSITIVO",
      }),
    ).toBe(true);
  });

  it("acepta donante O para cualquier receptor ABO", () => {
    expect(
      esUnidadCompatible(unidad({ grupoABO: "O" }) as any, {
        grupoABO: "AB",
        factorRhD: "POSITIVO",
      }),
    ).toBe(true);
  });

  it("rechaza un grupo ABO incompatible", () => {
    expect(
      esUnidadCompatible(unidad({ grupoABO: "B" }) as any, {
        grupoABO: "A",
        factorRhD: "POSITIVO",
      }),
    ).toBe(false);
  });

  it("rechaza Rh positivo para receptor Rh negativo", () => {
    expect(
      esUnidadCompatible(unidad({ factorRhD: "POSITIVO" }) as any, {
        grupoABO: "A",
        factorRhD: "NEGATIVO",
      }),
    ).toBe(false);
  });
});

describe("seleccionComponente.service listarUnidadesCompatibles", () => {
  it("requiere una solicitud existente", async () => {
    const db = fakeDb({ solicitud: null });

    await expect(
      listarUnidadesCompatibles(999, db as never),
    ).rejects.toBeInstanceOf(SolicitudNoEncontradaError);
  });

  it("requiere una solicitud aprobada", async () => {
    const db = fakeDb({
      solicitud: { ...solicitudAprobada(), estado: "PENDIENTE" },
    });

    await expect(
      listarUnidadesCompatibles(7, db as never),
    ).rejects.toBeInstanceOf(SolicitudNoAprobadaError);
  });

  it("lista solo unidades compatibles, disponibles y no vencidas", async () => {
    const db = fakeDb({
      unidades: [
        unidad({ id: 1, numeroUnidad: "U-1001", grupoABO: "A" }),
        unidad({ id: 2, numeroUnidad: "U-1002", grupoABO: "O" }),
        unidad({ id: 3, numeroUnidad: "U-1003", grupoABO: "B" }),
        unidad({ id: 4, numeroUnidad: "U-1004", estado: "BLOQUEADA" }),
        unidad({ id: 5, numeroUnidad: "U-1005", fechaVencimiento: enDias(-1) }),
      ],
    });

    const resultado = await listarUnidadesCompatibles(7, db as never);

    expect(resultado.unidades.map((u: any) => u.numeroUnidad)).toEqual([
      "U-1001",
      "U-1002",
    ]);
    expect(resultado.sinUnidadesDisponibles).toBe(false);
  });

  it("informa cuando no hay unidades compatibles disponibles", async () => {
    const db = fakeDb({
      unidades: [unidad({ grupoABO: "B", factorRhD: "POSITIVO" })],
    });

    const resultado = await listarUnidadesCompatibles(7, db as never);

    expect(resultado.unidades).toEqual([]);
    expect(resultado.sinUnidadesDisponibles).toBe(true);
    expect(resultado.mensaje).toContain("No hay unidades compatibles");
  });
});

describe("seleccionComponente.service listarUnidadesReservadas", () => {
  it("requiere una solicitud existente", async () => {
    const db = fakeDb({ solicitud: null });

    await expect(
      listarUnidadesReservadas(999, db as never),
    ).rejects.toBeInstanceOf(SolicitudNoEncontradaError);
  });

  it("lista las unidades ya preparadas para la solicitud", async () => {
    const db = fakeDb({
      unidades: [
        unidad({
          id: 1,
          numeroUnidad: "U-1001",
          estado: "RESERVADA",
          solicitudId: 7,
          reservadaPor: "Operador",
          reservadaEn: new Date(),
        }),
        unidad({
          id: 2,
          numeroUnidad: "U-1002",
          estado: "RESERVADA",
          solicitudId: 7,
          reservadaPor: "Operador",
          reservadaEn: new Date(),
        }),
      ],
    });

    const resultado = await listarUnidadesReservadas(7, db as never);

    expect(db.unidadSangre.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { solicitudId: 7 } }),
    );
    expect(resultado.unidades.map((u: any) => u.numeroUnidad)).toEqual([
      "U-1001",
      "U-1002",
    ]);
    expect(resultado.mensaje).toContain("2 unidad(es) preparada(s)");
  });

  it("informa cuando todavía no hay unidades preparadas", async () => {
    const db = fakeDb({ unidades: [] });

    const resultado = await listarUnidadesReservadas(7, db as never);

    expect(resultado.unidades).toEqual([]);
    expect(resultado.mensaje).toContain(
      "Todavía no hay unidades preparadas",
    );
  });
});

describe("seleccionComponente.service reservarUnidad", () => {
  it("reserva la unidad para el paciente de la solicitud", async () => {
    const unidadPreparada = unidad({
      estado: "RESERVADA",
      solicitudId: 7,
      reservadaPor: "Operador",
      reservadaEn: new Date(),
    });
    const db = fakeDb({
      unidades: [unidad()],
      resultadoReserva: { count: 1 },
      unidadReservada: unidadPreparada,
    });

    const resultado = await reservarUnidad(7, 1, "Operador", db as never);

    expect(db.unidadSangre.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, estado: "DISPONIBLE" },
        data: expect.objectContaining({
          estado: "RESERVADA",
          solicitudId: 7,
          reservadaPor: "Operador",
        }),
      }),
    );
    expect(resultado.unidad.estado).toBe("RESERVADA");
    expect(resultado.mensaje).toContain("Lucía Fernández");
    expect(resultado.mensaje).toContain("U-1001");
  });

  it("impide preparar una unidad que ya no está disponible", async () => {
    const db = fakeDb({
      unidades: [unidad()],
      resultadoReserva: { count: 0 },
    });

    await expect(
      reservarUnidad(7, 1, "Operador", db as never),
    ).rejects.toBeInstanceOf(UnidadNoDisponibleError);
  });

  it("impide preparar una unidad incompatible con el receptor", async () => {
    const db = fakeDb({
      unidades: [unidad({ grupoABO: "B" })],
    });

    await expect(
      reservarUnidad(7, 1, "Operador", db as never),
    ).rejects.toBeInstanceOf(UnidadNoCompatibleError);
  });

  it("impide preparar una unidad vencida", async () => {
    const db = fakeDb({
      unidades: [unidad({ fechaVencimiento: enDias(-2) })],
    });

    await expect(
      reservarUnidad(7, 1, "Operador", db as never),
    ).rejects.toBeInstanceOf(UnidadNoDisponibleError);
  });
});
