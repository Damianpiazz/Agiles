import { describe, expect, it, vi } from "vitest";
import {
  actualizar,
  aprobar,
  buscarPorId,
  cancelar,
  crear,
  PacienteSolicitudNoEncontradoError,
  SolicitudTransfusionCanceladaError,
  SolicitudTransfusionConUnidadesError,
  SolicitudTransfusionNoEncontradaError,
  SolicitudTransfusionSinPacienteError,
  SolicitudTransfusionYaAprobadaError,
} from "./solicitudTransfusion.service";
import { listarUnidadesCompatibles } from "./seleccionComponente.service";
import type {
  ActualizarSolicitudTransfusionInput,
  CrearSolicitudTransfusionInput,
} from "../types/solicitudTransfusion.types";

const fechaPedido = new Date("2026-11-21T11:00:00.000Z");
const fechaLaboratorio = new Date("2026-11-21T08:00:00.000Z");
const campos = {
  pacienteId: 3,
  modalidad: "INTERNACION",
  servicioSolicitante: "Clínica médica",
  sala: "4",
  cama: "12",
  piso: "3",
  sector: "Ala norte",
  diagnosticoBase: "Anemia",
  diagnosticoIndicacion: "Hemoglobina baja sintomática",
  antecedenteTransfusional: "SI",
  reaccionTransfusionalPrev: "NO",
  sensibilizacionObstetrica: "IGNORADO",
  grupoABO: "A",
  factorRhD: "POSITIVO",
  hematocrito: 22,
  hemoglobina: 7.1,
  plaquetas: 180000,
  fechaHoraLaboratorio: fechaLaboratorio,
  tipoHemocomponente: "GLOBULOS_ROJOS",
  cantidad: 2,
  volumenMl: 600,
  irradiado: false,
  lavado: false,
  desleucocitado: true,
  fraccionadoPediatrico: false,
  caracter: "URGENTE",
  fechaHoraPedido: fechaPedido,
  medicoPrescriptor: "Dra. Ana Pérez",
  firmaAclarada: "Ana Pérez",
  matriculaPrescriptor: "MN 12345",
  operador: "Operador de prueba",
};
const paciente = { id: 3, nombre: "Lucía", apellido: "Fernández", dni: "30111222" };

function baseSolicitud(overrides: Record<string, unknown> = {}) {
  return {
    id: 20,
    ...campos,
    dniPaciente: paciente.dni,
    nombrePaciente: `${paciente.nombre} ${paciente.apellido}`,
    fechaHora: fechaPedido,
    fechaHoraRecepcion: fechaPedido,
    estado: "PENDIENTE",
    unidades: [],
    ...overrides,
  };
}

function fakeDb({
  pacienteEncontrado = paciente,
  solicitud = baseSolicitud(),
  updateManyCount = 1,
  solicitudTrasAprobar,
}: {
  pacienteEncontrado?: typeof paciente | null;
  solicitud?: ReturnType<typeof baseSolicitud> | null;
  updateManyCount?: number;
  solicitudTrasAprobar?: ReturnType<typeof baseSolicitud> | null;
} = {}) {
  let estadoActual = solicitud ? { ...solicitud } : null;
  const tx = {
    paciente: { findUnique: vi.fn().mockResolvedValue(pacienteEncontrado) },
    solicitudTransfusion: {
      create: vi.fn().mockResolvedValue(baseSolicitud()),
      findMany: vi.fn().mockResolvedValue([baseSolicitud()]),
      findUnique: vi.fn().mockImplementation(() => {
        if (solicitudTrasAprobar !== undefined && tx.solicitudTransfusion.updateMany.mock.calls.length > 0) {
          return Promise.resolve(solicitudTrasAprobar);
        }
        return Promise.resolve(estadoActual);
      }),
      update: vi.fn().mockImplementation(({ data }) => {
        estadoActual = baseSolicitud(data);
        return Promise.resolve(estadoActual);
      }),
      updateMany: vi.fn().mockImplementation(({ data }) => {
        if (updateManyCount > 0 && estadoActual) {
          estadoActual = { ...estadoActual, ...data };
        }
        return Promise.resolve({ count: updateManyCount });
      }),
    },
    solicitudTransfusionAuditoria: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    unidadSangre: { count: vi.fn().mockResolvedValue(0) },
  };

  const db = {
    ...tx,
    $transaction: vi.fn((callback) => callback(tx)),
  };
  return { db: db as never, tx };
}

describe("solicitudTransfusion.service crear", () => {
  it("crea la solicitud pendiente asociada al paciente y registra la creación", async () => {
    const { db, tx } = fakeDb();
    const resultado = await crear(campos as CrearSolicitudTransfusionInput, db);

    expect(tx.solicitudTransfusion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pacienteId: 3,
        dniPaciente: "30111222",
        nombrePaciente: "Lucía Fernández",
        grupoABO: "A",
        tipoHemocomponente: "GLOBULOS_ROJOS",
        operador: "Operador de prueba",
        fechaHora: fechaPedido,
      }),
      include: { paciente: true },
    });
    expect(tx.solicitudTransfusionAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        solicitudId: 20,
        accion: "CREACION",
        operador: "Operador de prueba",
      }),
    });
    expect(resultado.estado).toBe("PENDIENTE");
  });

  it("rechaza asociar la solicitud a un paciente que no existe", async () => {
    const { db, tx } = fakeDb({ pacienteEncontrado: null });

    await expect(crear(campos as CrearSolicitudTransfusionInput, db)).rejects.toBeInstanceOf(
      PacienteSolicitudNoEncontradoError,
    );
    expect(tx.solicitudTransfusion.create).not.toHaveBeenCalled();
  });
});

describe("solicitudTransfusion.service actualizar", () => {
  it("guarda una modificación y su valor anterior/nuevo con actor y motivo", async () => {
    const actual = baseSolicitud();
    const { db, tx } = fakeDb({ solicitud: actual });
    const datos = {
      ...campos,
      operador: "Operador que modifica",
      motivoModificacion: "Actualización del diagnóstico",
      diagnosticoIndicacion: "Nueva indicación clínica",
    } as ActualizarSolicitudTransfusionInput;

    await actualizar(20, datos, db);

    expect(tx.solicitudTransfusionAuditoria.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          accion: "MODIFICACION",
          datoModificado: "diagnosticoIndicacion",
          valorAnterior: "Hemoglobina baja sintomática",
          valorNuevo: "Nueva indicación clínica",
          motivo: "Actualización del diagnóstico",
          operador: "Operador que modifica",
        }),
      ]),
    });
  });

  it("no permite modificar solicitudes canceladas", async () => {
    const { db } = fakeDb({ solicitud: baseSolicitud({ estado: "CANCELADA" }) });

    await expect(
      actualizar(
        20,
        { ...campos, motivoModificacion: "Corrección" } as ActualizarSolicitudTransfusionInput,
        db,
      ),
    ).rejects.toBeInstanceOf(SolicitudTransfusionCanceladaError);
  });

  it("protege solicitudes con unidades reservadas", async () => {
    const { db, tx } = fakeDb({
      solicitud: baseSolicitud({ unidades: [{ id: 8, estado: "RESERVADA" }] }),
    });

    await expect(
      actualizar(
        20,
        { ...campos, motivoModificacion: "Corrección" } as ActualizarSolicitudTransfusionInput,
        db,
      ),
    ).rejects.toBeInstanceOf(SolicitudTransfusionConUnidadesError);
    expect(tx.solicitudTransfusion.update).not.toHaveBeenCalled();
  });

  it("protege solicitudes con unidades emitidas al actualizar y al cancelar", async () => {
    const { db: dbAct, tx: txAct } = fakeDb({
      solicitud: baseSolicitud({
        estado: "APROBADA",
        unidades: [{ id: 9, estado: "EMITIDA" }],
      }),
    });

    await expect(
      actualizar(
        20,
        { ...campos, motivoModificacion: "Corrección" } as ActualizarSolicitudTransfusionInput,
        dbAct,
      ),
    ).rejects.toThrow("tiene unidades reservadas o emitidas");
    expect(txAct.solicitudTransfusion.findUnique).toHaveBeenCalledWith({
      where: { id: 20 },
      include: {
        unidades: {
          where: { estado: { in: ["RESERVADA", "EMITIDA"] } },
          select: { id: true },
        },
      },
    });
    expect(txAct.solicitudTransfusion.update).not.toHaveBeenCalled();

    const { db: dbCanc, tx: txCanc } = fakeDb({
      solicitud: baseSolicitud({
        estado: "APROBADA",
        unidades: [{ id: 9, estado: "EMITIDA" }],
      }),
    });

    await expect(
      cancelar(20, { operador: "Ana", motivo: "Cancelación tardía" }, dbCanc),
    ).rejects.toThrow("tiene unidades reservadas o emitidas");
    expect(txCanc.solicitudTransfusion.findUnique).toHaveBeenCalledWith({
      where: { id: 20 },
      include: {
        unidades: {
          where: { estado: { in: ["RESERVADA", "EMITIDA"] } },
          select: { id: true },
        },
      },
    });
    expect(txCanc.solicitudTransfusion.update).not.toHaveBeenCalled();
  });

  it("al editar una solicitud aprobada la devuelve a pendiente, limpia datos de aprobación y registra APROBACION_REVOCADA", async () => {
    const aprobada = baseSolicitud({
      estado: "APROBADA",
      aprobadaPor: "Dra. Laura Méndez",
      fechaHoraAprobacion: new Date("2026-11-21T12:00:00.000Z"),
      opinionMedica: "Indicación correcta",
    });
    const { db, tx } = fakeDb({ solicitud: aprobada });
    const datos = {
      ...campos,
      cantidad: 3,
      operador: "Operador que modifica",
      motivoModificacion: "Ajuste de unidades por hemorragia",
    } as ActualizarSolicitudTransfusionInput;

    const resultado = await actualizar(20, datos, db);

    expect(tx.solicitudTransfusion.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        cantidad: 3,
        estado: "PENDIENTE",
        aprobadaPor: null,
        fechaHoraAprobacion: null,
        opinionMedica: null,
      }),
      include: { paciente: true },
    });
    expect(tx.solicitudTransfusionAuditoria.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          solicitudId: 20,
          accion: "MODIFICACION",
          datoModificado: "cantidad",
          valorAnterior: "2",
          valorNuevo: "3",
          motivo: "Ajuste de unidades por hemorragia",
          operador: "Operador que modifica",
        }),
        expect.objectContaining({
          solicitudId: 20,
          accion: "APROBACION_REVOCADA",
          datoModificado: "estado",
          valorAnterior: "APROBADA",
          valorNuevo: "PENDIENTE",
          motivo: "Ajuste de unidades por hemorragia",
          operador: "Operador que modifica",
        }),
      ]),
    });
    expect(resultado.estado).toBe("PENDIENTE");
    expect(resultado.aprobadaPor).toBeNull();
  });
});

describe("solicitudTransfusion.service aprobar", () => {
  it("aprueba una solicitud pendiente, guarda quién, cuándo y la opinión médica, y crea auditoría", async () => {
    const { db, tx } = fakeDb({ solicitud: baseSolicitud({ estado: "PENDIENTE" }) });

    const resultado = await aprobar(
      20,
      {
        operador: "Dra. Laura Méndez",
        opinionMedica: "Indicación justificada por anemia sintomática",
      },
      db,
    );

    expect(tx.solicitudTransfusion.updateMany).toHaveBeenCalledWith({
      where: { id: 20, estado: "PENDIENTE" },
      data: {
        estado: "APROBADA",
        aprobadaPor: "Dra. Laura Méndez",
        fechaHoraAprobacion: expect.any(Date),
        opinionMedica: "Indicación justificada por anemia sintomática",
      },
    });
    expect(tx.solicitudTransfusionAuditoria.create).toHaveBeenCalledWith({
      data: {
        solicitudId: 20,
        accion: "APROBACION",
        datoModificado: "estado",
        valorAnterior: "PENDIENTE",
        valorNuevo: "APROBADA",
        motivo: "Indicación justificada por anemia sintomática",
        operador: "Dra. Laura Méndez",
      },
    });
    expect(resultado.estado).toBe("APROBADA");
    expect(resultado.aprobadaPor).toBe("Dra. Laura Méndez");
    expect(resultado.opinionMedica).toBe("Indicación justificada por anemia sintomática");
    expect(resultado.fechaHoraAprobacion).toBeInstanceOf(Date);
  });

  it("aprueba sin opinión médica guardando null en opinionMedica y motivo de auditoría", async () => {
    const { db, tx } = fakeDb({ solicitud: baseSolicitud({ estado: "PENDIENTE" }) });

    const resultado = await aprobar(20, { operador: "Dr. Juan Sosa" }, db);

    expect(tx.solicitudTransfusion.updateMany).toHaveBeenCalledWith({
      where: { id: 20, estado: "PENDIENTE" },
      data: expect.objectContaining({
        estado: "APROBADA",
        aprobadaPor: "Dr. Juan Sosa",
        opinionMedica: null,
      }),
    });
    expect(tx.solicitudTransfusionAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accion: "APROBACION",
        motivo: null,
        operador: "Dr. Juan Sosa",
      }),
    });
    expect(resultado.opinionMedica).toBeNull();
  });

  it("rechaza aprobar una solicitud inexistente", async () => {
    const { db, tx } = fakeDb({ solicitud: null });

    await expect(
      aprobar(999, { operador: "Dra. Laura Méndez" }, db),
    ).rejects.toBeInstanceOf(SolicitudTransfusionNoEncontradaError);
    expect(tx.solicitudTransfusion.updateMany).not.toHaveBeenCalled();
  });

  it("rechaza aprobar una solicitud cancelada y una ya aprobada con mensajes distintos", async () => {
    const { db: dbCancelada, tx: txCancelada } = fakeDb({
      solicitud: baseSolicitud({ estado: "CANCELADA" }),
    });
    const { db: dbAprobada, tx: txAprobada } = fakeDb({
      solicitud: baseSolicitud({ estado: "APROBADA" }),
    });

    let errCancelada: unknown;
    try {
      await aprobar(20, { operador: "Dra. Laura Méndez" }, dbCancelada);
    } catch (e) {
      errCancelada = e;
    }

    let errAprobada: unknown;
    try {
      await aprobar(20, { operador: "Dra. Laura Méndez" }, dbAprobada);
    } catch (e) {
      errAprobada = e;
    }

    expect(errCancelada).toBeInstanceOf(SolicitudTransfusionCanceladaError);
    expect(errAprobada).toBeInstanceOf(SolicitudTransfusionYaAprobadaError);
    expect((errCancelada as Error).message).not.toBe((errAprobada as Error).message);
    expect(txCancelada.solicitudTransfusion.updateMany).not.toHaveBeenCalled();
    expect(txAprobada.solicitudTransfusion.updateMany).not.toHaveBeenCalled();
  });

  it("rechaza aprobar una solicitud sin paciente asociado", async () => {
    const { db, tx } = fakeDb({
      solicitud: baseSolicitud({ pacienteId: null }),
    });

    await expect(
      aprobar(20, { operador: "Dra. Laura Méndez" }, db),
    ).rejects.toBeInstanceOf(SolicitudTransfusionSinPacienteError);
    expect(tx.solicitudTransfusion.updateMany).not.toHaveBeenCalled();
  });

  it("rechaza doble aprobación concurrente cuando updateMany devuelve count 0", async () => {
    const { db, tx } = fakeDb({
      solicitud: baseSolicitud({ estado: "PENDIENTE" }),
      updateManyCount: 0,
    });

    await expect(
      aprobar(20, { operador: "Dra. Laura Méndez" }, db),
    ).rejects.toBeInstanceOf(SolicitudTransfusionYaAprobadaError);
    expect(tx.solicitudTransfusionAuditoria.create).not.toHaveBeenCalled();
  });

  it("regresión HU-017: listarUnidadesCompatibles funciona con una solicitud aprobada por aprobar()", async () => {
    const { db } = fakeDb({ solicitud: baseSolicitud({ estado: "PENDIENTE" }) });
    const aprobada = await aprobar(
      20,
      { operador: "Dra. Laura Méndez", opinionMedica: "Aprobada para cirugía" },
      db,
    );

    const unidadCompatible = {
      id: 101,
      numeroUnidad: "U-101",
      tipoHemocomponente: "GLOBULOS_ROJOS",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      estado: "DISPONIBLE",
      fechaVencimiento: new Date("2099-12-31T00:00:00.000Z"),
    };

    const seleccionDb = {
      solicitudTransfusion: {
        findUnique: vi.fn().mockResolvedValue(aprobada),
        findMany: vi.fn(),
      },
      unidadSangre: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([unidadCompatible]),
        count: vi.fn().mockResolvedValue(0),
        updateMany: vi.fn(),
      },
    };

    const resultado = await listarUnidadesCompatibles(20, seleccionDb);

    expect(resultado.solicitud.estado).toBe("APROBADA");
    expect(resultado.unidades).toHaveLength(1);
    expect(resultado.unidades[0].numeroUnidad).toBe("U-101");
  });
});

describe("solicitudTransfusion.service cancelar", () => {
  it("cancela sin borrar la solicitud y agrega un evento de auditoría", async () => {
    const { db, tx } = fakeDb();

    await cancelar(20, { operador: "Ana", motivo: "Pedido duplicado" }, db);

    expect(tx.solicitudTransfusion.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { estado: "CANCELADA" },
      include: { paciente: true },
    });
    expect(tx.solicitudTransfusionAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accion: "CANCELACION",
        datoModificado: "estado",
        valorAnterior: "PENDIENTE",
        valorNuevo: "CANCELADA",
        motivo: "Pedido duplicado",
        operador: "Ana",
      }),
    });
  });
});

describe("solicitudTransfusion.service consultas", () => {
  it("lista por estado y paciente conservando include para selección de unidades", async () => {
    const { db, tx } = fakeDb();

    const resultado = await (await import("./solicitudTransfusion.service")).listar(
      { estado: "APROBADA", pacienteId: 3 },
      db,
    );

    expect(tx.solicitudTransfusion.findMany).toHaveBeenLastCalledWith({
      where: { estado: "APROBADA", pacienteId: 3 },
      include: {
        paciente: true,
        auditoria: { orderBy: { fechaHora: "desc" } },
      },
      orderBy: [{ fechaHora: "desc" }, { id: "desc" }],
    });
    expect(resultado).toHaveLength(1);
  });

  it("consulta el detalle con paciente, auditoría y unidades", async () => {
    const { db, tx } = fakeDb();
    await buscarPorId(20, db);

    expect(tx.solicitudTransfusion.findUnique).toHaveBeenCalledWith({
      where: { id: 20 },
      include: {
        paciente: true,
        auditoria: { orderBy: { fechaHora: "desc" } },
        unidades: { orderBy: { numeroUnidad: "asc" } },
      },
    });
  });
});
