import { describe, expect, it } from "vitest";
import {
  aprobarSolicitudTransfusionSchema,
  solicitudTransfusionFormSchema,
} from "./solicitudTransfusion";

const pedido = new Date(Date.now() - 10 * 60 * 1000);
const base = {
  pacienteId: 3,
  modalidad: "INTERNACION",
  servicioSolicitante: "Clínica médica",
  sala: "4",
  cama: "12",
  diagnosticoBase: "Anemia",
  diagnosticoIndicacion: "Hemoglobina baja",
  antecedenteTransfusional: "NO",
  reaccionTransfusionalPrev: "NO",
  sensibilizacionObstetrica: "IGNORADO",
  grupoABO: "A",
  factorRhD: "POSITIVO",
  hematocrito: "22",
  hemoglobina: "7.2",
  plaquetas: "180000",
  fechaHoraLaboratorio: new Date(pedido.getTime() - 2 * 60 * 60 * 1000),
  tipoHemocomponente: "GLOBULOS_ROJOS",
  cantidad: "2",
  volumenMl: "",
  irradiado: false,
  lavado: false,
  desleucocitado: false,
  fraccionadoPediatrico: false,
  caracter: "PROGRAMADA",
  fechaHoraPedido: pedido,
  medicoPrescriptor: "Dra. Ana Pérez",
  firmaAclarada: "Ana Pérez",
  matriculaPrescriptor: "MN123",
  operador: "Operador",
};

describe("solicitudTransfusionFormSchema", () => {
  it("identifica que el laboratorio excede las doce horas", () => {
    const resultado = solicitudTransfusionFormSchema.safeParse({
      ...base,
      fechaHoraLaboratorio: new Date(pedido.getTime() - 13 * 60 * 60 * 1000),
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["fechaHoraLaboratorio"],
          message: "Los estudios deben tener una antigüedad máxima de 12 horas",
        }),
      );
    }
  });

  it("informa los campos obligatorios faltantes para internación", () => {
    const resultado = solicitudTransfusionFormSchema.safeParse({
      ...base,
      servicioSolicitante: " ",
      sala: "",
      cama: "",
      diagnosticoIndicacion: "",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const campos = resultado.error.issues.map((issue) => issue.path[0]);
      expect(campos).toEqual(expect.arrayContaining([
        "servicioSolicitante",
        "sala",
        "cama",
        "diagnosticoIndicacion",
      ]));
    }
  });

  it("acepta modalidad ambulatoria con su unidad y sin campos de internación", () => {
    expect(
      solicitudTransfusionFormSchema.safeParse({
        ...base,
        modalidad: "AMBULATORIA",
        unidadRealizacion: "Hospital de día",
        servicioSolicitante: "",
        sala: "",
        cama: "",
      }).success,
    ).toBe(true);
  });
});

describe("aprobarSolicitudTransfusionSchema", () => {
  it("acepta operador válido con o sin opinión médica", () => {
    const sinOpinion = aprobarSolicitudTransfusionSchema.safeParse({
      operador: "Dra. Laura Méndez",
      opinionMedica: "   ",
    });
    expect(sinOpinion.success).toBe(true);
    if (sinOpinion.success) {
      expect(sinOpinion.data.opinionMedica).toBeUndefined();
    }

    const conOpinion = aprobarSolicitudTransfusionSchema.safeParse({
      operador: "Dr. Martín Ruiz",
      opinionMedica: "Indicación acorde a hemoglobina",
    });
    expect(conOpinion.success).toBe(true);
    if (conOpinion.success) {
      expect(conOpinion.data.opinionMedica).toBe("Indicación acorde a hemoglobina");
    }
  });

  it("rechaza operador vacío o que supere 120 caracteres y opinión mayor a 1000", () => {
    expect(
      aprobarSolicitudTransfusionSchema.safeParse({ operador: "  " }).success,
    ).toBe(false);
    expect(
      aprobarSolicitudTransfusionSchema.safeParse({ operador: "a".repeat(121) })
        .success,
    ).toBe(false);
    expect(
      aprobarSolicitudTransfusionSchema.safeParse({
        operador: "Dra. Laura Méndez",
        opinionMedica: "x".repeat(1001),
      }).success,
    ).toBe(false);
  });
});
