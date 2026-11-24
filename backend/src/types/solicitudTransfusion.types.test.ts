import { describe, expect, it } from "vitest";
import {
  aprobarSolicitudTransfusionSchema,
  crearSolicitudTransfusionSchema,
} from "./solicitudTransfusion.types";

const ahora = new Date();
const valido = {
  pacienteId: 2,
  modalidad: "INTERNACION",
  servicioSolicitante: "Clínica médica",
  sala: "4",
  cama: "12",
  piso: "3",
  sector: "Ala norte",
  diagnosticoBase: "Anemia crónica",
  diagnosticoIndicacion: "Hemoglobina baja sintomática",
  antecedenteTransfusional: "SI",
  reaccionTransfusionalPrev: "NO",
  sensibilizacionObstetrica: "IGNORADO",
  grupoABO: "A",
  factorRhD: "POSITIVO",
  hematocrito: 22,
  hemoglobina: 7.1,
  plaquetas: 180000,
  fechaHoraLaboratorio: new Date(ahora.getTime() - 60 * 60 * 1000),
  tipoHemocomponente: "GLOBULOS_ROJOS",
  cantidad: 2,
  irradiado: false,
  lavado: false,
  desleucocitado: true,
  fraccionadoPediatrico: false,
  caracter: "URGENTE",
  fechaHoraPedido: ahora,
  medicoPrescriptor: "Dra. María López",
  firmaAclarada: "María López",
  matriculaPrescriptor: "MN 12345",
  operador: "Operador de prueba",
};

describe("crearSolicitudTransfusionSchema", () => {
  it("acepta una solicitud completa con laboratorio reciente", () => {
    expect(crearSolicitudTransfusionSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza estudios de laboratorio con más de 12 horas", () => {
    const resultado = crearSolicitudTransfusionSchema.safeParse({
      ...valido,
      fechaHoraLaboratorio: new Date(ahora.getTime() - 13 * 60 * 60 * 1000),
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza un paciente sin identificación registrada y datos obligatorios incompletos", () => {
    expect(
      crearSolicitudTransfusionSchema.safeParse({
        ...valido,
        pacienteId: 0,
        medicoPrescriptor: " ",
      }).success,
    ).toBe(false);
  });

    it("exige sala y cama para internación", () => {
      expect(
        crearSolicitudTransfusionSchema.safeParse({
          ...valido,
          sala: "",
        }).success,
      ).toBe(false);
    });

    it("exige la unidad de realización para modalidad ambulatoria", () => {
      expect(
        crearSolicitudTransfusionSchema.safeParse({
          ...valido,
          modalidad: "AMBULATORIA",
          unidadRealizacion: "Hospital de día",
          servicioSolicitante: undefined,
          sala: undefined,
          cama: undefined,
        }).success,
      ).toBe(true);
      expect(
        crearSolicitudTransfusionSchema.safeParse({
          ...valido,
          modalidad: "AMBULATORIA",
          servicioSolicitante: undefined,
          sala: undefined,
          cama: undefined,
        }).success,
      ).toBe(false);
    });

    it("exige dirección para modalidad domiciliaria", () => {
      expect(
        crearSolicitudTransfusionSchema.safeParse({
          ...valido,
          modalidad: "DOMICILIARIA",
          domicilioRealizacion: "Calle 123, La Plata",
          servicioSolicitante: undefined,
          sala: undefined,
          cama: undefined,
        }).success,
      ).toBe(true);
      expect(
        crearSolicitudTransfusionSchema.safeParse({
          ...valido,
          modalidad: "DOMICILIARIA",
          servicioSolicitante: undefined,
          sala: undefined,
          cama: undefined,
        }).success,
      ).toBe(false);
    });
});

describe("aprobarSolicitudTransfusionSchema", () => {
  it("acepta operador válido sin opinión médica", () => {
    const resultado = aprobarSolicitudTransfusionSchema.safeParse({
      operador: "  Dra. Carla Gómez  ",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.operador).toBe("Dra. Carla Gómez");
      expect(resultado.data.opinionMedica).toBeUndefined();
    }
  });

  it("acepta opinión médica opcional y recorta espacios", () => {
    const resultado = aprobarSolicitudTransfusionSchema.safeParse({
      operador: "Dr. Martín Ruiz",
      opinionMedica: "  Indicación acorde a hemoglobina clínica  ",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.opinionMedica).toBe(
        "Indicación acorde a hemoglobina clínica",
      );
    }
  });

  it("rechaza operador faltante, vacío o mayor a 120 caracteres", () => {
    expect(aprobarSolicitudTransfusionSchema.safeParse({}).success).toBe(false);
    expect(
      aprobarSolicitudTransfusionSchema.safeParse({ operador: "   " }).success,
    ).toBe(false);
    expect(
      aprobarSolicitudTransfusionSchema.safeParse({
        operador: "a".repeat(121),
      }).success,
    ).toBe(false);
  });

  it("rechaza opinión médica mayor a 1000 caracteres", () => {
    expect(
      aprobarSolicitudTransfusionSchema.safeParse({
        operador: "Dr. Martín Ruiz",
        opinionMedica: "x".repeat(1001),
      }).success,
    ).toBe(false);
  });
});
