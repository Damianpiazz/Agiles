
import { describe, expect, it, vi } from "vitest";

import {
  registrar,
  listarPorSolicitud,
  SolicitudEstudioNoEncontradaError,
  SolicitudEstudioSinPacienteError,
  SolicitudEstudioCanceladaError,
  UnidadEstudioNoEncontradaError,
  UnidadEstudioNoValidaError,
} from "./estudioPretransfusional.service";

import type {
  EstudioPretransfusionalDb,
} from "./estudioPretransfusional.service";

import type {
  CrearEstudioPretransfusionalInput,
} from "../types/estudioPretransfusional.types";

// Datos ficticios para las pruebas.


const solicitudBase: {
  id: number;
  pacienteId: number | null;
  estado: string;
  tipoHemocomponente: string;
} = {
  id: 1,
  pacienteId: 10,
  estado: "PENDIENTE",
  tipoHemocomponente: "GLOBULOS_ROJOS",
};


const unidadBase = {
  id: 7,
  numeroUnidad: "UNIDAD-007",
  solicitudId: 1,
  tipoHemocomponente: "GLOBULOS_ROJOS",
  estado: "RESERVADA",
};

const datosBasicos: CrearEstudioPretransfusionalInput = {
  tipo: "DETECCION_ANTICUERPOS",
  resultado: "NEGATIVO",
  operador: "Jero",
};

const datosPruebaCruzada: CrearEstudioPretransfusionalInput = {
  tipo: "PRUEBA_CRUZADA",
  resultado: "Compatible",
  unidadSangreId: 7,
  compatibilidad: "COMPATIBLE",
  operador: "Jero",
};

// Simula las operaciones de Prisma sin modificar la BD.

function crearDb() {
  const buscarSolicitud = vi.fn(
    async (
      _args: unknown,
    ): Promise<typeof solicitudBase | null> => ({
      ...solicitudBase,
    }),
  );

  const buscarUnidad = vi.fn(
    async (
      _args: unknown,
    ): Promise<typeof unidadBase | null> => ({
      ...unidadBase,
    }),
  );

  const guardarEstudio = vi.fn(async (args: unknown) => {
    const { data } = args as {
      data: {
        solicitudId: number;
        tipo: string;
        resultado: string;
        unidadSangreId: number | null;
        compatibilidad: string | null;
        observaciones: string | null;
        operador: string;
      };
    };

    return {
      id: 20,
      ...data,
      fechaHora: new Date("2026-11-22T15:00:00.000Z"),
      createdAt: new Date("2026-11-22T15:00:00.000Z"),
    };
  });

  const buscarEstudios = vi.fn(
    async (
      _args: unknown,
    ): Promise<
      Array<{
        id: number;
        tipo: string;
        compatibilidad: string | null;
        operador: string;
      }>
    > => [],
  );

  const db: EstudioPretransfusionalDb = {
    solicitudTransfusion: {
      findUnique: buscarSolicitud,
    },
    unidadSangre: {
      findUnique: buscarUnidad,
    },
    estudioPretransfusional: {
      create: guardarEstudio,
      findMany: buscarEstudios,
    },
  };

  return {
    db,
    buscarSolicitud,
    buscarUnidad,
    guardarEstudio,
    buscarEstudios,
  };
}

describe("HU-016 - Estudios pretransfusionales", () => {
  // CA1: registro asociado a una solicitud existente.

  it("registra un estudio para una solicitud con paciente", async () => {
    const { db, guardarEstudio } = crearDb();

    const resultado = await registrar(
      1,
      datosBasicos,
      db,
    );

    expect(resultado.estudio.id).toBe(20);
    expect(resultado.alerta).toBeNull();

    expect(guardarEstudio).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          solicitudId: 1,
          tipo: "DETECCION_ANTICUERPOS",
          resultado: "NEGATIVO",
          operador: "Jero",
        }),
      }),
    );
  });

  it("rechaza una solicitud inexistente", async () => {
    const { db, buscarSolicitud, guardarEstudio } =
      crearDb();

    buscarSolicitud.mockResolvedValueOnce(null);

    await expect(
      registrar(999, datosBasicos, db),
    ).rejects.toBeInstanceOf(
      SolicitudEstudioNoEncontradaError,
    );

    expect(guardarEstudio).not.toHaveBeenCalled();
  });

  it("rechaza una solicitud sin paciente asociado", async () => {
    const { db, buscarSolicitud } = crearDb();

    buscarSolicitud.mockResolvedValueOnce({
      ...solicitudBase,
      pacienteId: null,
    });

    await expect(
      registrar(1, datosBasicos, db),
    ).rejects.toBeInstanceOf(
      SolicitudEstudioSinPacienteError,
    );
  });

  it("no permite registrar estudios en solicitudes canceladas", async () => {
    const { db, buscarSolicitud, guardarEstudio } =
      crearDb();

    buscarSolicitud.mockResolvedValueOnce({
      ...solicitudBase,
      estado: "CANCELADA",
    });

    await expect(
      registrar(1, datosBasicos, db),
    ).rejects.toBeInstanceOf(
      SolicitudEstudioCanceladaError,
    );

    expect(guardarEstudio).not.toHaveBeenCalled();
  });

  // CA2: prueba de compatibilidad asociada a una unidad.

  it("registra una prueba cruzada compatible", async () => {
    const { db, buscarUnidad, guardarEstudio } =
      crearDb();

    const resultado = await registrar(
      1,
      datosPruebaCruzada,
      db,
    );

    expect(resultado.alerta).toBeNull();

    expect(buscarUnidad).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
      }),
    );

    expect(guardarEstudio).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          solicitudId: 1,
          unidadSangreId: 7,
          compatibilidad: "COMPATIBLE",
        }),
      }),
    );
  });

  it("rechaza una unidad de sangre inexistente", async () => {
    const { db, buscarUnidad, guardarEstudio } =
      crearDb();

    buscarUnidad.mockResolvedValueOnce(null);

    await expect(
      registrar(1, datosPruebaCruzada, db),
    ).rejects.toBeInstanceOf(
      UnidadEstudioNoEncontradaError,
    );

    expect(guardarEstudio).not.toHaveBeenCalled();
  });

  it("rechaza una unidad asociada a otra solicitud", async () => {
    const { db, buscarUnidad, guardarEstudio } =
      crearDb();

    buscarUnidad.mockResolvedValueOnce({
      ...unidadBase,
      solicitudId: 99,
    });

    await expect(
      registrar(1, datosPruebaCruzada, db),
    ).rejects.toBeInstanceOf(
      UnidadEstudioNoValidaError,
    );

    expect(guardarEstudio).not.toHaveBeenCalled();
  });

  it("rechaza un hemocomponente diferente al solicitado", async () => {
    const { db, buscarUnidad } = crearDb();

    buscarUnidad.mockResolvedValueOnce({
      ...unidadBase,
      tipoHemocomponente: "PLASMA",
    });

    await expect(
      registrar(1, datosPruebaCruzada, db),
    ).rejects.toBeInstanceOf(
      UnidadEstudioNoValidaError,
    );
  });

  it("rechaza unidades en estado EMITIDA, DADA_DE_BAJA, VENCIDA o BLOQUEADA para prueba cruzada", async () => {
    for (const estado of ["EMITIDA", "DADA_DE_BAJA", "VENCIDA", "BLOQUEADA"]) {
      const { db, buscarUnidad, guardarEstudio } = crearDb();

      buscarUnidad.mockResolvedValueOnce({
        ...unidadBase,
        estado,
      });

      await expect(
        registrar(1, datosPruebaCruzada, db),
      ).rejects.toBeInstanceOf(UnidadEstudioNoValidaError);
      expect(guardarEstudio).not.toHaveBeenCalled();
    }
  });

  // CA3: alerta ante incompatibilidad.

  it("genera una alerta cuando la prueba cruzada es incompatible", async () => {
    const { db, guardarEstudio } = crearDb();

    const resultado = await registrar(
      1,
      {
        ...datosPruebaCruzada,
        resultado: "Incompatible",
        compatibilidad: "INCOMPATIBLE",
      },
      db,
    );

    expect(resultado.alerta).toContain(
      "incompatibilidad",
    );

    expect(guardarEstudio).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          compatibilidad: "INCOMPATIBLE",
        }),
      }),
    );
  });

  // CA4: operador y fecha/hora.

  it("conserva el operador y devuelve la fecha registrada", async () => {
    const { db, guardarEstudio } = crearDb();

    const resultado = await registrar(
      1,
      datosBasicos,
      db,
    );

    expect(guardarEstudio).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          operador: "Jero",
        }),
      }),
    );

    expect(resultado.estudio.fechaHora).toBeInstanceOf(
      Date,
    );
  });

  // Consulta del historial.

  it("lista los estudios asociados a una solicitud", async () => {
    const { db, buscarEstudios } = crearDb();

    buscarEstudios.mockResolvedValueOnce([
      {
        id: 30,
        tipo: "PRUEBA_CRUZADA",
        compatibilidad: "INCOMPATIBLE",
        operador: "Jero",
      },
      {
        id: 29,
        tipo: "DETECCION_ANTICUERPOS",
        compatibilidad: null,
        operador: "Jero",
      },
    ]);

    const resultado = await listarPorSolicitud(1, db);

    expect(resultado.solicitudId).toBe(1);
    expect(resultado.pacienteId).toBe(10);
    expect(resultado.estudios).toHaveLength(2);

    expect(resultado.estudios[0].alerta).toContain(
      "incompatibilidad",
    );

    expect(resultado.estudios[1].alerta).toBeNull();

    expect(buscarEstudios).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          solicitudId: 1,
        },
      }),
    );
  });
});
