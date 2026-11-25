import { z } from "zod";

const requerido = z.string({ error: "Obligatorio" }).trim().min(1, "Obligatorio");
const antecedenteSchema = z.enum(["SI", "NO", "IGNORADO"], {
  error: "Indicá sí, no o si se ignora",
});

const datosSolicitud = z.object({
  pacienteId: z.coerce.number().int().positive("Seleccioná un paciente registrado"),
  modalidad: z.enum(["INTERNACION", "AMBULATORIA", "DOMICILIARIA"], {
    error: "Seleccioná la modalidad de atención",
  }),
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
  antecedenteTransfusional: antecedenteSchema,
  reaccionTransfusionalPrev: antecedenteSchema,
  sensibilizacionObstetrica: antecedenteSchema,
  grupoABO: z.enum(["A", "B", "AB", "O"], { error: "Seleccioná el grupo ABO" }),
  factorRhD: z.enum(["POSITIVO", "NEGATIVO"], { error: "Seleccioná el factor RhD" }),
  hematocrito: z.coerce.number().gt(0, "Ingresá un hematocrito válido").max(100),
  hemoglobina: z.coerce.number().gt(0, "Ingresá una hemoglobina válida").max(30),
  plaquetas: z.coerce.number().int().positive("Ingresá un recuento de plaquetas válido"),
  fechaHoraLaboratorio: z.coerce.date({ error: "Indicá la fecha y hora del laboratorio" }),
  tipoHemocomponente: z.enum(
    ["GLOBULOS_ROJOS", "PLASMA", "PLAQUETAS", "CRIOPRECIPITADO"],
    { error: "Seleccioná el componente sanguíneo" },
  ),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor que cero"),
  volumenMl: z.coerce.number().int().positive().optional(),
  irradiado: z.boolean().default(false),
  lavado: z.boolean().default(false),
  desleucocitado: z.boolean().default(false),
  fraccionadoPediatrico: z.boolean().default(false),
  caracter: z.enum(["PROGRAMADA", "NO_URGENTE", "RESERVA", "URGENTE", "EMERGENCIA"], {
    error: "Seleccioná el carácter de la transfusión",
  }),
  fechaHoraPedido: z.coerce.date({ error: "Indicá la fecha y hora del pedido" }),
  medicoPrescriptor: requerido,
  firmaAclarada: requerido,
  matriculaPrescriptor: requerido,
  operador: requerido.max(120, "El operador no puede superar los 120 caracteres"),
  observaciones: z.string().trim().optional(),
});

function validarSolicitud(
  datos: z.infer<typeof datosSolicitud>,
  ctx: z.RefinementCtx,
) {
  const requerirCampo = (
    campo: keyof typeof datos,
    valor: string | undefined,
    mensaje: string,
  ) => {
    if (!valor?.trim()) {
      ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
    }
  };

  if (datos.modalidad === "INTERNACION") {
    requerirCampo("servicioSolicitante", datos.servicioSolicitante, "Indicá el servicio solicitante");
    requerirCampo("sala", datos.sala, "Indicá la sala");
    requerirCampo("cama", datos.cama, "Indicá la cama");
  } else if (datos.modalidad === "AMBULATORIA") {
    requerirCampo("unidadRealizacion", datos.unidadRealizacion, "Indicá el servicio o unidad de realización");
  } else {
    requerirCampo("domicilioRealizacion", datos.domicilioRealizacion, "Indicá el domicilio de realización");
  }

  const diferencia = datos.fechaHoraPedido.getTime() - datos.fechaHoraLaboratorio.getTime();
  if (diferencia < 0) {
    ctx.addIssue({
      code: "custom",
      path: ["fechaHoraLaboratorio"],
      message: "El laboratorio no puede ser posterior al pedido",
    });
  } else if (diferencia > 12 * 60 * 60 * 1000) {
    ctx.addIssue({
      code: "custom",
      path: ["fechaHoraLaboratorio"],
      message: "Los estudios de laboratorio deben tener una antigüedad máxima de 12 horas",
    });
  }

  if (datos.fechaHoraPedido.getTime() > Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["fechaHoraPedido"],
      message: "La fecha y hora del pedido no puede ser futura",
    });
  }
}

export const crearSolicitudTransfusionSchema = datosSolicitud.superRefine(
  validarSolicitud,
);

export const actualizarSolicitudTransfusionSchema = datosSolicitud
  .extend({
    operador: requerido.max(120, "El operador no puede superar los 120 caracteres"),
    motivoModificacion: requerido,
  })
  .superRefine(validarSolicitud);

export const cancelarSolicitudTransfusionSchema = z.object({
  operador: requerido.max(120, "El operador no puede superar los 120 caracteres"),
  motivo: requerido,
});

export const aprobarSolicitudTransfusionSchema = z.object({
  operador: requerido.max(120, "El operador no puede superar los 120 caracteres"),
  opinionMedica: z
    .string()
    .trim()
    .max(1000, "La opinión médica no puede superar los 1000 caracteres")
    .transform((valor) => (valor ? valor : undefined))
    .optional(),
});

export const listarSolicitudesTransfusionSchema = z.object({
  estado: z.enum(["PENDIENTE", "APROBADA", "CANCELADA"]).optional(),
  pacienteId: z.coerce.number().int().positive().optional(),
});

export const idSolicitudTransfusionSchema = z.coerce
  .number()
  .int("ID de solicitud inválido")
  .positive("ID de solicitud inválido");

export type CrearSolicitudTransfusionInput = z.infer<typeof crearSolicitudTransfusionSchema>;
export type ActualizarSolicitudTransfusionInput = z.infer<typeof actualizarSolicitudTransfusionSchema>;
export type CancelarSolicitudTransfusionInput = z.infer<typeof cancelarSolicitudTransfusionSchema>;
export type AprobarSolicitudTransfusionInput = z.infer<typeof aprobarSolicitudTransfusionSchema>;
export type ListarSolicitudesTransfusionInput = z.infer<typeof listarSolicitudesTransfusionSchema>;
