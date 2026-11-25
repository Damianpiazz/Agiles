import { z } from "zod";

const requerido = z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio");
const antecedente = z.enum(["SI", "NO", "IGNORADO"], {
  error: "Indicá sí, no o si se ignora",
});
const fecha = z.coerce.date({ error: "Ingresá una fecha y hora válida" });
const volumenOpcional = z.preprocess(
  (valor) => (typeof valor === "string" && !valor.trim() ? undefined : valor),
  z.coerce.number().int().positive("El volumen debe ser mayor que cero").optional(),
);

export const solicitudTransfusionFormSchema = z
  .object({
    pacienteId: z.coerce.number().int().positive("Seleccioná un paciente registrado"),
    modalidad: z.enum(["INTERNACION", "AMBULATORIA", "DOMICILIARIA"]),
    servicioSolicitante: z.string().trim().optional(),
    sala: z.string().trim().optional(),
    cama: z.string().trim().optional(),
    piso: z.string().trim().optional(),
    sector: z.string().trim().optional(),
    unidadRealizacion: z.string().trim().optional(),
    servicioDerivante: z.string().trim().optional(),
    domicilioRealizacion: z.string().trim().optional(),
    localidadReferencia: z.string().trim().optional(),
    diagnosticoBase: requerido,
    diagnosticoIndicacion: requerido,
    antecedenteTransfusional: antecedente,
    reaccionTransfusionalPrev: antecedente,
    sensibilizacionObstetrica: antecedente,
    grupoABO: z.enum(["A", "B", "AB", "O"], { error: "Seleccioná el grupo ABO" }),
    factorRhD: z.enum(["POSITIVO", "NEGATIVO"], { error: "Seleccioná el factor RhD" }),
    hematocrito: z.coerce.number().gt(0, "Ingresá un hematocrito válido").max(100),
    hemoglobina: z.coerce.number().gt(0, "Ingresá una hemoglobina válida").max(30),
    plaquetas: z.coerce.number().int().positive("Ingresá un recuento de plaquetas válido"),
    fechaHoraLaboratorio: fecha,
    tipoHemocomponente: z.enum(
      ["GLOBULOS_ROJOS", "PLASMA", "PLAQUETAS", "CRIOPRECIPITADO"],
      { error: "Seleccioná el componente sanguíneo" },
    ),
    cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor que cero"),
    volumenMl: volumenOpcional,
    irradiado: z.boolean().default(false),
    lavado: z.boolean().default(false),
    desleucocitado: z.boolean().default(false),
    fraccionadoPediatrico: z.boolean().default(false),
    caracter: z.enum(["PROGRAMADA", "NO_URGENTE", "RESERVA", "URGENTE", "EMERGENCIA"], {
      error: "Seleccioná el carácter de la transfusión",
    }),
    fechaHoraPedido: fecha,
    medicoPrescriptor: requerido,
    firmaAclarada: requerido,
    matriculaPrescriptor: requerido,
    operador: requerido.max(120, "El operador no puede superar los 120 caracteres"),
    observaciones: z.string().trim().optional(),
    motivoModificacion: z.string().optional(),
  })
  .superRefine((datos, ctx) => {
    const requerir = (campo: string, valor: string | undefined, mensaje: string) => {
      if (!valor?.trim()) ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
    };

    if (datos.modalidad === "INTERNACION") {
      requerir("servicioSolicitante", datos.servicioSolicitante, "Indicá el servicio solicitante");
      requerir("sala", datos.sala, "Indicá la sala");
      requerir("cama", datos.cama, "Indicá la cama");
    } else if (datos.modalidad === "AMBULATORIA") {
      requerir("unidadRealizacion", datos.unidadRealizacion, "Indicá el servicio o unidad de realización");
    } else {
      requerir("domicilioRealizacion", datos.domicilioRealizacion, "Indicá el domicilio de realización");
    }

    const antiguedadLaboratorio =
      datos.fechaHoraPedido.getTime() - datos.fechaHoraLaboratorio.getTime();
    if (antiguedadLaboratorio < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["fechaHoraLaboratorio"],
        message: "El laboratorio no puede ser posterior al pedido",
      });
    } else if (antiguedadLaboratorio > 12 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: "custom",
        path: ["fechaHoraLaboratorio"],
        message: "Los estudios deben tener una antigüedad máxima de 12 horas",
      });
    }

    if (datos.fechaHoraPedido.getTime() > Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["fechaHoraPedido"],
        message: "La fecha y hora del pedido no puede ser futura",
      });
    }
  });

export type SolicitudTransfusionFormInput = z.infer<
  typeof solicitudTransfusionFormSchema
>;

export const aprobarSolicitudTransfusionSchema = z.object({
  operador: requerido.max(120, "El operador no puede superar los 120 caracteres"),
  opinionMedica: z
    .string()
    .trim()
    .max(1000, "La opinión médica no puede superar los 1000 caracteres")
    .transform((valor) => (valor ? valor : undefined))
    .optional(),
});

export type AprobarSolicitudTransfusionInput = z.infer<
  typeof aprobarSolicitudTransfusionSchema
>;
