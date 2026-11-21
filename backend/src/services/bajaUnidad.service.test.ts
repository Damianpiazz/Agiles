import { describe, expect, it, vi } from "vitest";
import { darDeBajaUnidadSchema } from "../types/bajaUnidad.types";
import {
  darDeBaja,
  UnidadNoEncontradaError,
  UnidadYaDadaDeBajaError,
  type BajaUnidadDb,
} from "./bajaUnidad.service";
import {
  UnidadNoDisponibleError,
  listarUnidadesCompatibles,
  reservarUnidad,
} from "./seleccionComponente.service";

function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + cantidad);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function unidadInventario(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    numeroUnidad: "U-1001",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    grupoABO: "A",
    factorRhD: "POSITIVO",
    fechaVencimiento: enDias(20),
    estado: "DISPONIBLE",
    operador: "Laura Gómez",
    motivoBaja: null,
    operadorBaja: null,
    fechaBaja: null,
    ...overrides,
  };
}

function fakeBajaDb(unidad: any): BajaUnidadDb & {
  unidadSangre: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
} {
  return {
    unidadSangre: {
      findUnique: vi.fn().mockResolvedValue(unidad),
      update: vi
        .fn()
        .mockImplementation(({ data }: any) =>
          Promise.resolve({ ...unidad, ...data }),
        ),
    },
  };
}

function solicitudAprobada() {
  return {
    id: 7,
    dniPaciente: "30111222",
    nombrePaciente: "Lucía Fernández",
    grupoABO: "A",
    factorRhD: "POSITIVO",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    cantidad: 1,
    estado: "APROBADA",
    operador: "Operador",
    fechaHora: new Date(),
  };
}

describe("darDeBajaUnidadSchema (CA1, CA2)", () => {
  it("acepta los tres motivos de baja admitidos (CA2)", () => {
    for (const motivo of ["VENCIDA", "TRANSFUNDIDA", "DESCARTADA"] as const) {
      const parsed = darDeBajaUnidadSchema.safeParse({
        motivo,
        operador: "Laura Gómez",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.motivo).toBe(motivo);
      }
    }
  });

  it("exige el motivo y el operador (CA1, CA5)", () => {
    const parsed = darDeBajaUnidadSchema.safeParse({});

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const rutas = parsed.error.issues.map((i) => i.path[0]);
      expect(rutas).toContain("motivo");
      expect(rutas).toContain("operador");
    }
  });

  it("rechaza un motivo fuera de los admitidos (CA2)", () => {
    const parsed = darDeBajaUnidadSchema.safeParse({
      motivo: "ROTA",
      operador: "Laura Gómez",
    });

    expect(parsed.success).toBe(false);
  });

  it("recorta el nombre del operador", () => {
    const parsed = darDeBajaUnidadSchema.safeParse({
      motivo: "DESCARTADA",
      operador: "  Laura Gómez  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.operador).toBe("Laura Gómez");
    }
  });
});

describe("bajaUnidad.service darDeBaja (CA1, CA2, CA3, CA5)", () => {
  it("registra motivo, operador y fecha/hora, y deja la unidad no disponible (CA1, CA2, CA3, CA5)", async () => {
    const db = fakeBajaDb(unidadInventario());

    const resultado = await darDeBaja(
      1,
      { motivo: "TRANSFUNDIDA", operador: "Laura Gómez" },
      db,
    );

    expect(db.unidadSangre.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        estado: "DADA_DE_BAJA",
        motivoBaja: "TRANSFUNDIDA",
        operadorBaja: "Laura Gómez",
        fechaBaja: expect.any(Date),
      },
    });
    expect(resultado.estado).toBe("DADA_DE_BAJA");
    expect(resultado.motivoBaja).toBe("TRANSFUNDIDA");
  });

  it("lanza UnidadNoEncontradaError cuando la unidad no existe (CA1)", async () => {
    const db = fakeBajaDb(null);

    await expect(
      darDeBaja(99, { motivo: "VENCIDA", operador: "Laura Gómez" }, db),
    ).rejects.toBeInstanceOf(UnidadNoEncontradaError);
    expect(db.unidadSangre.update).not.toHaveBeenCalled();
  });

  it("impide dar de baja dos veces la misma unidad (CA4)", async () => {
    const db = fakeBajaDb(
      unidadInventario({
        estado: "DADA_DE_BAJA",
        motivoBaja: "DESCARTADA",
        operadorBaja: "Laura Gómez",
        fechaBaja: new Date(),
      }),
    );

    await expect(
      darDeBaja(1, { motivo: "VENCIDA", operador: "Otro Operador" }, db),
    ).rejects.toBeInstanceOf(UnidadYaDadaDeBajaError);
    expect(db.unidadSangre.update).not.toHaveBeenCalled();
  });
});

describe("CA4: una unidad dada de baja no puede utilizarse ni seleccionarse", () => {
  it("no se lista entre las unidades disponibles de una solicitud", async () => {
    const db = {
      solicitudTransfusion: {
        findUnique: vi.fn().mockResolvedValue(solicitudAprobada()),
      },
      unidadSangre: {
        findMany: vi
          .fn()
          .mockResolvedValue([unidadInventario({ estado: "DADA_DE_BAJA" })]),
        count: vi.fn().mockResolvedValue(0),
      },
    };

    const resultado = await listarUnidadesCompatibles(7, db as never);

    expect(db.unidadSangre.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: "DISPONIBLE" }),
      }),
    );
    expect(resultado.unidades).toHaveLength(0);
  });

  it("no permite reservarla para una solicitud", async () => {
    const db = {
      solicitudTransfusion: {
        findUnique: vi.fn().mockResolvedValue(solicitudAprobada()),
      },
      unidadSangre: {
        findUnique: vi
          .fn()
          .mockResolvedValue(unidadInventario({ estado: "DADA_DE_BAJA" })),
        count: vi.fn().mockResolvedValue(0),
        updateMany: vi.fn(),
      },
    };

    await expect(
      reservarUnidad(7, 1, "Laura Gómez", db as never),
    ).rejects.toBeInstanceOf(UnidadNoDisponibleError);
    expect(db.unidadSangre.updateMany).not.toHaveBeenCalled();
  });
});
