import { describe, expect, it, vi } from "vitest";
import {
  actualizar,
  buscarPorId,
  cancelar,
  crear,
  PacienteSolicitudNoEncontradoError,
  SolicitudTransfusionCanceladaError,
  SolicitudTransfusionConUnidadesError,
} from "./solicitudTransfusion.service";
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
}: {
  pacienteEncontrado?: typeof paciente | null;
  solicitud?: ReturnType<typeof baseSolicitud> | null;
} = {}) {
  const tx = {
    paciente: { findUnique: vi.fn().mockResolvedValue(pacienteEncontrado) },
    solicitudTransfusion: {
      create: vi.fn().mockResolvedValue(baseSolicitud()),
      findMany: vi.fn().mockResolvedValue([baseSolicitud()]),
      findUnique: vi.fn().mockResolvedValue(solicitud),
      update: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve(baseSolicitud(data)),
      ),
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
