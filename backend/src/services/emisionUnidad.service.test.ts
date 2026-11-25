import { describe, expect, it, vi } from "vitest";
import {
  emitir,
  listarPorSolicitud,
  listarPorUnidad,
  PruebaCruzadaIncompatibleError,
  SolicitudEmisionNoEncontradaError,
  SolicitudNoAprobadaParaEmisionError,
  SolicitudSinPacienteParaEmisionError,
  UnidadEmisionNoEncontradaError,
  UnidadIncompatibleParaEmisionError,
  UnidadNoPerteneceASolicitudError,
  UnidadNoReservadaParaEmisionError,
  UnidadVencidaParaEmisionError,
} from "./emisionUnidad.service";

function baseSolicitud(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    pacienteId: 3,
    dniPaciente: "30111222",
    nombrePaciente: "Lucía Fernández",
    grupoABO: "A",
    factorRhD: "POSITIVO",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    cantidad: 2,
    estado: "APROBADA",
    caracter: "PROGRAMADA",
    irradiado: true,
    lavado: false,
    desleucocitado: true,
    fraccionadoPediatrico: false,
    ...overrides,
  };
}

function baseUnidad(overrides: Record<string, unknown> = {}) {
  return {
    id: 50,
    numeroUnidad: "U-2026-050",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    grupoABO: "A",
    factorRhD: "POSITIVO",
    fechaVencimiento: new Date("2099-12-31T00:00:00.000Z"),
    estado: "RESERVADA",
    solicitudId: 10,
    ...overrides,
  };
}

function fakeDb({
  solicitud = baseSolicitud(),
  unidad = baseUnidad(),
  pruebaCruzada = {
    id: 7,
    tipo: "PRUEBA_CRUZADA",
    compatibilidad: "COMPATIBLE",
    resultado: "Compatible sin aglutinación",
    fechaHora: new Date("2026-11-24T10:00:00.000Z"),
  } as Record<string, unknown> | null,
  updateManyCount = 1,
  emisiones = [] as Record<string, unknown>[],
}: {
  solicitud?: ReturnType<typeof baseSolicitud> | null;
  unidad?: ReturnType<typeof baseUnidad> | null;
  pruebaCruzada?: Record<string, unknown> | null;
  updateManyCount?: number;
  emisiones?: Record<string, unknown>[];
} = {}) {
  let unidadActual = unidad ? { ...unidad } : null;

  const tx = {
    solicitudTransfusion: {
      findUnique: vi.fn().mockResolvedValue(solicitud),
    },
    unidadSangre: {
      findUnique: vi.fn().mockImplementation(() => Promise.resolve(unidadActual)),
      updateMany: vi.fn().mockImplementation(({ data }) => {
        if (updateManyCount > 0 && unidadActual) {
          unidadActual = { ...unidadActual, ...data };
        }
        return Promise.resolve({ count: updateManyCount });
      }),
    },
    estudioPretransfusional: {
      findFirst: vi.fn().mockResolvedValue(pruebaCruzada),
    },
    emisionUnidad: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 99,
          fechaHora: new Date("2026-11-24T15:30:00.000Z"),
          createdAt: new Date("2026-11-24T15:30:00.000Z"),
          ...data,
        }),
      ),
      findMany: vi.fn().mockResolvedValue(emisiones),
    },
  };

  const db = {
    ...tx,
    $transaction: vi.fn((callback) => callback(tx)),
  };

  return { db: db as never, tx };
}

describe("emisionUnidad.service emitir", () => {
  it("CA1 + CA2: emite una unidad reservada con prueba cruzada compatible, registra snapshot completo y genera etiqueta sin advertencias", async () => {
    const { db, tx } = fakeDb();

    const resultado = await emitir(
      10,
      50,
      { responsable: "Téc. Sofía Navarro", observaciones: "Retira enfermería UTI" },
      db,
    );

    expect(tx.unidadSangre.updateMany).toHaveBeenCalledWith({
      where: { id: 50, estado: "RESERVADA", solicitudId: 10 },
      data: { estado: "EMITIDA" },
    });
    expect(tx.emisionUnidad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        unidadSangreId: 50,
        solicitudId: 10,
        pacienteId: 3,
        dniPaciente: "30111222",
        nombrePaciente: "Lucía Fernández",
        grupoABOReceptor: "A",
        factorRhDReceptor: "POSITIVO",
        numeroUnidad: "U-2026-050",
        tipoHemocomponente: "GLOBULOS_ROJOS",
        grupoABOUnidad: "A",
        factorRhDUnidad: "POSITIVO",
        caracter: "PROGRAMADA",
        requisitosEspeciales: "Irradiado, Desleucocitado",
        resultadoCompatibilidad: "COMPATIBLE",
        compatibilidadCompleta: true,
        responsable: "Téc. Sofía Navarro",
        observaciones: "Retira enfermería UTI",
      }),
    });
    expect(resultado.unidad.estado).toBe("EMITIDA");
    expect(resultado.advertencias).toEqual([]);
    expect(resultado.etiqueta).toMatchObject({
      receptor: {
        nombre: "Lucía Fernández",
        dni: "30111222",
        grupoABO: "A",
        factorRhD: "POSITIVO",
      },
      unidad: {
        numeroUnidad: "U-2026-050",
        tipoHemocomponente: "GLOBULOS_ROJOS",
        grupoABO: "A",
        factorRhD: "POSITIVO",
      },
      requisitosEspeciales: "Irradiado, Desleucocitado",
      compatibilidadCompleta: true,
      interpretacionCompatibilidad: "Prueba cruzada compatible",
      responsable: "Téc. Sofía Navarro",
    });
  });

  it("rechaza si la solicitud no existe sin modificar unidad ni crear emisión", async () => {
    const { db, tx } = fakeDb({ solicitud: null });

    await expect(
      emitir(999, 50, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(SolicitudEmisionNoEncontradaError);
    expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("rechaza si la unidad no existe sin modificar ni crear emisión", async () => {
    const { db, tx } = fakeDb({ unidad: null });

    await expect(
      emitir(10, 999, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(UnidadEmisionNoEncontradaError);
    expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("rechaza si la solicitud no tiene paciente asociado", async () => {
    const { db, tx } = fakeDb({ solicitud: baseSolicitud({ pacienteId: null }) });

    await expect(
      emitir(10, 50, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(SolicitudSinPacienteParaEmisionError);
    expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("rechaza si la solicitud está PENDIENTE o CANCELADA", async () => {
    for (const estado of ["PENDIENTE", "CANCELADA"]) {
      const { db, tx } = fakeDb({ solicitud: baseSolicitud({ estado }) });
      await expect(
        emitir(10, 50, { responsable: "Téc. Sofía" }, db),
      ).rejects.toBeInstanceOf(SolicitudNoAprobadaParaEmisionError);
      expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
      expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
    }
  });

  it("CA3: rechaza unidades en estado distinto de RESERVADA indicando el estado actual en el mensaje", async () => {
    for (const estado of [
      "DISPONIBLE",
      "BLOQUEADA",
      "VENCIDA",
      "DADA_DE_BAJA",
      "EMITIDA",
    ]) {
      const { db, tx } = fakeDb({
        unidad: baseUnidad({
          estado,
          solicitudId: estado === "EMITIDA" ? 10 : null,
        }),
      });

      await expect(
        emitir(10, 50, { responsable: "Téc. Sofía" }, db),
      ).rejects.toThrow(estado);
      await expect(
        emitir(10, 50, { responsable: "Téc. Sofía" }, db),
      ).rejects.toBeInstanceOf(UnidadNoReservadaParaEmisionError);
      expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
      expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
    }
  });

  it("rechaza si la unidad está reservada para otra solicitud", async () => {
    const { db, tx } = fakeDb({
      unidad: baseUnidad({ solicitudId: 77 }),
    });

    await expect(
      emitir(10, 50, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(UnidadNoPerteneceASolicitudError);
    expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("rechaza si la unidad está vencida", async () => {
    const { db, tx } = fakeDb({
      unidad: baseUnidad({ fechaVencimiento: new Date("2020-01-01T00:00:00.000Z") }),
    });

    await expect(
      emitir(10, 50, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(UnidadVencidaParaEmisionError);
    expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("rechaza incompatibilidad ABO/RhD entre receptor y unidad incluso si fue reservada", async () => {
    const { db, tx } = fakeDb({
      solicitud: baseSolicitud({ grupoABO: "O", factorRhD: "NEGATIVO" }),
      unidad: baseUnidad({ grupoABO: "A", factorRhD: "POSITIVO" }),
    });

    await expect(
      emitir(10, 50, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(UnidadIncompatibleParaEmisionError);
    expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("bloquea la emisión cuando la última prueba cruzada es INCOMPATIBLE (incluso en EMERGENCIA)", async () => {
    for (const caracter of ["PROGRAMADA", "EMERGENCIA"]) {
      const { db, tx } = fakeDb({
        solicitud: baseSolicitud({ caracter }),
        pruebaCruzada: {
          id: 9,
          tipo: "PRUEBA_CRUZADA",
          compatibilidad: "INCOMPATIBLE",
          resultado: "Aglutinación positiva",
        },
      });

      await expect(
        emitir(10, 50, { responsable: "Téc. Sofía" }, db),
      ).rejects.toBeInstanceOf(PruebaCruzadaIncompatibleError);
      expect(tx.unidadSangre.updateMany).not.toHaveBeenCalled();
      expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
    }
  });

  it("rechaza doble emisión concurrente cuando updateMany devuelve count 0", async () => {
    const { db, tx } = fakeDb({ updateManyCount: 0 });

    await expect(
      emitir(10, 50, { responsable: "Téc. Sofía" }, db),
    ).rejects.toBeInstanceOf(UnidadNoReservadaParaEmisionError);
    expect(tx.emisionUnidad.create).not.toHaveBeenCalled();
  });

  it("sin prueba cruzada en carácter no emergencia: emite con compatibilidadCompleta=false y advertencia", async () => {
    const { db } = fakeDb({
      solicitud: baseSolicitud({ caracter: "URGENTE" }),
      pruebaCruzada: null,
    });

    const resultado = await emitir(10, 50, { responsable: "Téc. Sofía" }, db);

    expect(resultado.emision.compatibilidadCompleta).toBe(false);
    expect(resultado.emision.resultadoCompatibilidad).toBeNull();
    expect(resultado.advertencias).toContain(
      "No hay prueba cruzada registrada para esta unidad.",
    );
    expect(resultado.etiqueta.compatibilidadCompleta).toBe(false);
  });

  it("sin prueba cruzada en carácter EMERGENCIA: emite con leyenda normativa en advertencia y etiqueta", async () => {
    const { db } = fakeDb({
      solicitud: baseSolicitud({ caracter: "EMERGENCIA" }),
      pruebaCruzada: null,
    });

    const resultado = await emitir(10, 50, { responsable: "Téc. Sofía" }, db);

    expect(resultado.emision.compatibilidadCompleta).toBe(false);
    expect(resultado.emision.resultadoCompatibilidad).toBeNull();
    expect(resultado.advertencias[0]).toContain(
      "Prueba de compatibilidad no completada al momento de la liberación",
    );
    expect(resultado.etiqueta.interpretacionCompatibilidad).toContain(
      "Prueba de compatibilidad no completada al momento de la liberación",
    );
  });
});

describe("emisionUnidad.service historial (CA4)", () => {
  const emisionBase = {
    id: 2,
    unidadSangreId: 50,
    solicitudId: 10,
    pacienteId: 3,
    dniPaciente: "30111222",
    nombrePaciente: "Lucía Fernández",
    grupoABOReceptor: "A",
    factorRhDReceptor: "POSITIVO",
    numeroUnidad: "U-2026-050",
    tipoHemocomponente: "GLOBULOS_ROJOS",
    grupoABOUnidad: "A",
    factorRhDUnidad: "POSITIVO",
    fechaVencimientoUnidad: new Date("2099-12-31T00:00:00.000Z"),
    caracter: "PROGRAMADA",
    requisitosEspeciales: null,
    resultadoCompatibilidad: "COMPATIBLE",
    compatibilidadCompleta: true,
    responsable: "Téc. Sofía Navarro",
    observaciones: null,
    fechaHora: new Date("2026-11-24T15:30:00.000Z"),
  };

  it("listarPorUnidad devuelve la unidad y sus emisiones ordenadas por fechaHora desc con etiqueta", async () => {
    const { db, tx } = fakeDb({
      unidad: baseUnidad({ estado: "EMITIDA" }),
      emisiones: [emisionBase],
    });

    const resultado = await listarPorUnidad(50, db);

    expect(tx.emisionUnidad.findMany).toHaveBeenCalledWith({
      where: { unidadSangreId: 50 },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    });
    expect(resultado.unidad.id).toBe(50);
    expect(resultado.emisiones).toHaveLength(1);
    expect(resultado.emisiones[0].etiqueta.receptor.dni).toBe("30111222");
  });

  it("listarPorUnidad rechaza si la unidad no existe", async () => {
    const { db } = fakeDb({ unidad: null });

    await expect(listarPorUnidad(999, db)).rejects.toBeInstanceOf(
      UnidadEmisionNoEncontradaError,
    );
  });

  it("listarPorSolicitud devuelve la solicitud y sus emisiones ordenadas por fechaHora desc", async () => {
    const { db, tx } = fakeDb({ emisiones: [emisionBase] });

    const resultado = await listarPorSolicitud(10, db);

    expect(tx.emisionUnidad.findMany).toHaveBeenCalledWith({
      where: { solicitudId: 10 },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    });
    expect(resultado.solicitud.id).toBe(10);
    expect(resultado.emisiones).toHaveLength(1);
  });

  it("listarPorSolicitud rechaza si la solicitud no existe", async () => {
    const { db } = fakeDb({ solicitud: null });

    await expect(listarPorSolicitud(999, db)).rejects.toBeInstanceOf(
      SolicitudEmisionNoEncontradaError,
    );
  });
});
