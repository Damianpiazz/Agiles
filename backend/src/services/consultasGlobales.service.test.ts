import { describe, expect, it, vi } from "vitest";
import { listar as listarEstudios } from "./estudioPretransfusional.service";
import type { EstudioPretransfusionalDb } from "./estudioPretransfusional.service";
import { listar as listarEmisiones } from "./emisionUnidad.service";
import type { EmisionDb } from "./emisionUnidad.service";

describe("consultas globales", () => {
  it("listarEstudios devuelve los estudios con alerta de incompatibilidad", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 1,
        tipo: "PRUEBA_CRUZADA",
        compatibilidad: "INCOMPATIBLE",
        resultado: "Incompatible",
        solicitud: { id: 3, dniPaciente: "30111222" },
      },
    ]);
    const db = {
      estudioPretransfusional: { findMany },
    } as unknown as EstudioPretransfusionalDb;

    const estudios = await listarEstudios(db);

    expect(estudios).toHaveLength(1);
    expect(estudios[0]?.alerta).toContain("ALERTA");
    expect(findMany).toHaveBeenCalled();
  });

  it("listarEmisiones devuelve las emisiones con su etiqueta", async () => {
    const emision = {
      id: 2,
      nombrePaciente: "Lucía Fernández",
      dniPaciente: "30111222",
      grupoABOReceptor: "A",
      factorRhDReceptor: "POSITIVO",
      numeroUnidad: "U-1",
      tipoHemocomponente: "GLOBULOS_ROJOS",
      grupoABOUnidad: "A",
      factorRhDUnidad: "POSITIVO",
      fechaVencimientoUnidad: new Date("2099-12-31T00:00:00.000Z"),
      requisitosEspeciales: null,
      resultadoCompatibilidad: "COMPATIBLE",
      compatibilidadCompleta: true,
      caracter: "PROGRAMADA",
      fechaHora: new Date("2026-11-24T15:30:00.000Z"),
      responsable: "farmacia",
    };
    const findMany = vi.fn().mockResolvedValue([emision]);
    const db = { emisionUnidad: { findMany } } as unknown as EmisionDb;

    const emisiones = await listarEmisiones(db);

    expect(emisiones).toHaveLength(1);
    expect(emisiones[0]?.etiqueta.receptor.dni).toBe("30111222");
    expect(emisiones[0]?.etiqueta.unidad.numeroUnidad).toBe("U-1");
  });
});
