import { describe, expect, it, vi } from "vitest";
import {
  crearRecepcionUnidadSchema,
  obtenerFechaHoyArgentina,
} from "../types/recepcionUnidad.types";
import {
  create,
  listar,
  UnidadDuplicadaError,
  type RecepcionUnidadDb,
} from "./recepcionUnidad.service";

function fakeDb(): RecepcionUnidadDb & {
  unidadSangre: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
} {
  return {
    unidadSangre: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

describe("crearRecepcionUnidadSchema (CA2, CA4 y fecha Argentina)", () => {
  it("acepta datos válidos y convierte fechaVencimiento a Date", () => {
    const hoyArg = obtenerFechaHoyArgentina();
    const parsed = crearRecepcionUnidadSchema.safeParse({
      numeroUnidad: "  U-2026-001  ",
      tipoHemocomponente: "GLOBULOS_ROJOS",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      fechaVencimiento: hoyArg,
      estado: "DISPONIBLE",
      operador: "  Laura Gómez  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.numeroUnidad).toBe("U-2026-001");
      expect(parsed.data.tipoHemocomponente).toBe("GLOBULOS_ROJOS");
      expect(parsed.data.grupoABO).toBe("A");
      expect(parsed.data.factorRhD).toBe("POSITIVO");
      expect(parsed.data.estado).toBe("DISPONIBLE");
      expect(parsed.data.operador).toBe("Laura Gómez");
      expect(parsed.data.fechaVencimiento).toBeInstanceOf(Date);
    }
  });

  it("informa los campos obligatorios faltantes cuando la información está incompleta (CA4)", () => {
    const parsed = crearRecepcionUnidadSchema.safeParse({});

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const rutas = parsed.error.issues.map((i) => i.path[0]);
      expect(rutas).toContain("numeroUnidad");
      expect(rutas).toContain("tipoHemocomponente");
      expect(rutas).toContain("grupoABO");
      expect(rutas).toContain("factorRhD");
      expect(rutas).toContain("fechaVencimiento");
      expect(rutas).toContain("operador");
    }
  });

  it("usa la fecha local de Argentina (America/Argentina/Buenos_Aires) y no UTC", () => {
    // 2026-10-31T01:30:00Z es 2026-10-30 22:30:00 en Buenos Aires (UTC-3)
    const instante = new Date("2026-10-31T01:30:00.000Z");
    expect(obtenerFechaHoyArgentina(instante)).toBe("2026-10-30");
  });

  it("rechaza una fecha de vencimiento anterior a hoy en Argentina", () => {
    const parsed = crearRecepcionUnidadSchema.safeParse({
      numeroUnidad: "U-1001",
      tipoHemocomponente: "PLASMA",
      grupoABO: "O",
      factorRhD: "NEGATIVO",
      fechaVencimiento: "2020-01-01",
      estado: "DISPONIBLE",
      operador: "Laura Gómez",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain(
        "no puede ser anterior a hoy",
      );
    }
  });

  it("rechaza un estado distinto de DISPONIBLE", () => {
    const hoyArg = obtenerFechaHoyArgentina();
    const parsed = crearRecepcionUnidadSchema.safeParse({
      numeroUnidad: "U-1001",
      tipoHemocomponente: "PLAQUETAS",
      grupoABO: "B",
      factorRhD: "POSITIVO",
      fechaVencimiento: hoyArg,
      estado: "BLOQUEADA",
      operador: "Laura Gómez",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("recepcionUnidad.service create y listar (CA1, CA2, CA3, CA5)", () => {
  it("guarda la unidad en el inventario con usuario y fecha/hora de trazabilidad (CA1, CA2, CA5)", async () => {
    const db = fakeDb();
    const fechaVenc = new Date("2026-12-31T00:00:00.000Z");
    const unidadGuardada = {
      id: 1,
      numeroUnidad: "U-1001",
      tipoHemocomponente: "GLOBULOS_ROJOS",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      fechaVencimiento: fechaVenc,
      estado: "DISPONIBLE",
      operador: "Laura Gómez",
      fechaRecepcion: new Date(),
    };
    db.unidadSangre.create.mockResolvedValue(unidadGuardada);

    const resultado = await create(
      {
        numeroUnidad: "U-1001",
        tipoHemocomponente: "GLOBULOS_ROJOS",
        grupoABO: "A",
        factorRhD: "POSITIVO",
        fechaVencimiento: fechaVenc,
        estado: "DISPONIBLE",
        operador: "Laura Gómez",
      },
      db,
    );

    expect(db.unidadSangre.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        numeroUnidad: "U-1001",
        tipoHemocomponente: "GLOBULOS_ROJOS",
        grupoABO: "A",
        factorRhD: "POSITIVO",
        fechaVencimiento: fechaVenc,
        estado: "DISPONIBLE",
        operador: "Laura Gómez",
        fechaRecepcion: expect.any(Date),
      }),
    });
    expect(resultado).toEqual(unidadGuardada);
  });

  it("lanza UnidadDuplicadaError cuando el número de unidad ya existe (CA3)", async () => {
    const db = fakeDb();
    db.unidadSangre.create.mockRejectedValue({ code: "P2002" });

    await expect(
      create(
        {
          numeroUnidad: "U-1001",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          grupoABO: "A",
          factorRhD: "POSITIVO",
          fechaVencimiento: new Date("2026-12-31T00:00:00.000Z"),
          estado: "DISPONIBLE",
          operador: "Laura Gómez",
        },
        db,
      ),
    ).rejects.toBeInstanceOf(UnidadDuplicadaError);
  });

  it("lista las unidades del inventario ordenadas por fecha de recepción descendente", async () => {
    const db = fakeDb();
    db.unidadSangre.findMany.mockResolvedValue([{ id: 2 }, { id: 1 }]);

    const resultado = await listar(db);

    expect(db.unidadSangre.findMany).toHaveBeenCalledWith({
      orderBy: [{ fechaRecepcion: "desc" }, { id: "desc" }],
    });
    expect(resultado).toHaveLength(2);
  });
});
