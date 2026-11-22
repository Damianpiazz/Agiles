import { describe, expect, it } from "vitest";
import { solicitudTransfusionFormSchema } from "./solicitudTransfusion";

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
