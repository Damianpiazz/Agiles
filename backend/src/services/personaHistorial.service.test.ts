import { describe, expect, it, vi } from "vitest";
import {
  consultar,
  DniInvalidoError,
  type PersonaHistorialDb,
} from "./personaHistorial.service";

function crearDb({
  donante = null as Record<string, unknown> | null,
  paciente = null as Record<string, unknown> | null,
  donaciones = [] as Record<string, unknown>[],
  solicitudes = [] as Record<string, unknown>[],
  emisiones = [] as Record<string, unknown>[],
  estudios = [] as Record<string, unknown>[],
} = {}) {
  const db: PersonaHistorialDb = {
    donante: { findUnique: vi.fn().mockResolvedValue(donante) },
    paciente: { findUnique: vi.fn().mockResolvedValue(paciente) },
    donacion: { findMany: vi.fn().mockResolvedValue(donaciones) },
    solicitudTransfusion: { findMany: vi.fn().mockResolvedValue(solicitudes) },
    emisionUnidad: { findMany: vi.fn().mockResolvedValue(emisiones) },
    estudioPretransfusional: { findMany: vi.fn().mockResolvedValue(estudios) },
  };
  return db;
}

describe("personaHistorial.service consultar", () => {
  it("rechaza un DNI con formato inválido", async () => {
    await expect(consultar("abc", crearDb())).rejects.toBeInstanceOf(
      DniInvalidoError,
    );
  });

  it("devuelve donante, paciente y todas sus transfusiones por DNI", async () => {
    const db = crearDb({
      donante: { id: 4, dni: "30111222", activo: true },
      paciente: { id: 9, dni: "30111222" },
      donaciones: [{ id: 11 }],
      solicitudes: [{ id: 21, dniPaciente: "30111222" }],
      emisiones: [{ id: 31, dniPaciente: "30111222" }],
      estudios: [{ id: 41, tipo: "PRUEBA_CRUZADA" }],
    });

    const resultado = await consultar("30111222", db);

    expect(resultado.dni).toBe("30111222");
    expect(resultado.donante?.id).toBe(4);
    expect(resultado.paciente?.id).toBe(9);
    expect(resultado.donaciones).toHaveLength(1);
    expect(resultado.solicitudes).toHaveLength(1);
    expect(resultado.emisiones).toHaveLength(1);
    expect(resultado.estudios).toHaveLength(1);
    expect(resultado.resumen).toMatchObject({
      esDonante: true,
      esPaciente: true,
      totalDonaciones: 1,
      totalSolicitudes: 1,
      totalEmisiones: 1,
      totalEstudios: 1,
    });
    expect(db.donacion.findMany).toHaveBeenCalled();
    expect(db.emisionUnidad.findMany).toHaveBeenCalled();
  });

  it("incluye solicitudes legacy por dniPaciente sin paciente vinculado", async () => {
    const db = crearDb({
      solicitudes: [{ id: 21, dniPaciente: "87661052", pacienteId: null }],
    });

    const resultado = await consultar("87661052", db);

    expect(resultado.paciente).toBeNull();
    expect(resultado.resumen.esPaciente).toBe(true);
    expect(resultado.solicitudes).toHaveLength(1);
  });

  it("no consulta donaciones cuando el DNI no es donante", async () => {
    const db = crearDb();

    const resultado = await consultar("27123456", db);

    expect(db.donacion.findMany).not.toHaveBeenCalled();
    expect(resultado.donante).toBeNull();
    expect(resultado.resumen.esDonante).toBe(false);
  });
});
