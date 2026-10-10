import { z } from "zod";

export const CLAVES_PREGUNTAS_COMUNES = [
  "seSienteBienYSanoHoy",
  "leyoHojaInformativa",
  "donoUltimas8Semanas",
  "inconvenientesPosteriores",
  "rechazosPrevios",
  "antibioticos",
  "tratamientoAcne",
  "tratamientoPsoriasis",
  "tratamientoProstata",
  "otrasMedicacionesRelevantes",
  "patologiaCardiaca",
  "patologiaPulmonar",
  "patologiaNeurologicaEpilepsia",
  "cancer",
  "quimioterapiaRadioterapia",
  "hormonasCrecimiento",
  "problemasCoagulacion",
  "sidaVih",
  "chagas",
  "hipertension",
  "rabia",
  "relacionesSexualesRiesgo",
  "parejasMultiples",
  "drogasInyectablesCocaina",
  "its",
  "tatuajes",
  "piercings",
  "acupuntura",
  "cirugias",
  "endoscopias",
  "transfusiones",
  "trasplantes",
  "exposicionSangre",
  "detencionesCarcelarias",
  "viajesZonasEndemicas",
  "donaParaPruebaVih",
  "recibioCompensacionEconomica",
] as const;

export const CLAVES_PREGUNTAS_MUJERES = [
  "embarazoActual",
  "partoAbortoCesareaUltimoAnio",
] as const;

export type ClavePreguntaComun = (typeof CLAVES_PREGUNTAS_COMUNES)[number];
export type ClavePreguntaMujer = (typeof CLAVES_PREGUNTAS_MUJERES)[number];

const respuestaBooleana = z.boolean({ error: "Obligatorio" });

function objetoRespuestas(claves: readonly string[]) {
  return z.object(
    Object.fromEntries(claves.map((clave) => [clave, respuestaBooleana])),
  );
}

const respuestasComunesSchema = objetoRespuestas(CLAVES_PREGUNTAS_COMUNES);
const respuestasMujeresSchema = objetoRespuestas(CLAVES_PREGUNTAS_MUJERES);

export const crearEntrevistaSchema = z.object({
  respuestas: z.record(z.string(), z.boolean(), { error: "Obligatorio" }),
  resultadoAdmision: z.enum(["ADMITIDO", "DIFERIDO"], {
    error: "Seleccioná el resultado de la evaluación",
  }),
  tipoDiferimiento: z.enum(["TEMPORAL", "PERMANENTE"]).optional(),
  causaDiferimiento: z.string().trim().min(1, "Ingresá la causa del diferimiento").optional(),
  entrevistador: z.string().trim().min(1, "Ingresá el nombre del personal entrevistador"),
}).superRefine((data, ctx) => {
  const comunes = respuestasComunesSchema.safeParse(data.respuestas);
  if (!comunes.success) {
    ctx.addIssue({
      code: "custom",
      path: ["respuestas"],
      message: "Completá todas las preguntas del cuestionario",
    });
  }

  if (data.resultadoAdmision === "DIFERIDO") {
    if (!data.tipoDiferimiento) {
      ctx.addIssue({
        code: "custom",
        path: ["tipoDiferimiento"],
        message: "Indicá si el diferimiento es temporal o permanente",
      });
    }
    if (!data.causaDiferimiento) {
      ctx.addIssue({
        code: "custom",
        path: ["causaDiferimiento"],
        message: "Ingresá la causa del diferimiento",
      });
    }
  } else if (data.tipoDiferimiento || data.causaDiferimiento) {
    ctx.addIssue({
      code: "custom",
      path: ["resultadoAdmision"],
      message: "Un donante admitido no puede tener datos de diferimiento",
    });
  }
});

export type CrearEntrevistaInput = z.infer<typeof crearEntrevistaSchema>;

export function validarRespuestasSegunSexo(
  sexoBiologico: "MASCULINO" | "FEMENINO",
  respuestas: Record<string, boolean>,
) {
  const clavesPresentes = Object.keys(respuestas);
  const clavesEsperadas =
    sexoBiologico === "FEMENINO"
      ? [...CLAVES_PREGUNTAS_COMUNES, ...CLAVES_PREGUNTAS_MUJERES]
      : [...CLAVES_PREGUNTAS_COMUNES];

  const faltantes = clavesEsperadas.filter((clave) => !(clave in respuestas));
  if (faltantes.length > 0) {
    return "Completá todas las preguntas aplicables al donante";
  }

  if (sexoBiologico === "MASCULINO") {
    const noCorresponden = CLAVES_PREGUNTAS_MUJERES.filter((clave) =>
      clavesPresentes.includes(clave),
    );
    if (noCorresponden.length > 0) {
      return "Las preguntas de antecedentes en mujeres no aplican a este donante";
    }
  }

  const extra = clavesPresentes.filter(
    (clave) => !(clavesEsperadas as readonly string[]).includes(clave),
  );
  if (extra.length > 0) {
    return "El cuestionario contiene preguntas no previstas";
  }

  const mujeres = respuestasMujeresSchema.safeParse(
    Object.fromEntries(
      CLAVES_PREGUNTAS_MUJERES.map((clave) => [clave, respuestas[clave]]),
    ),
  );
  if (sexoBiologico === "FEMENINO" && !mujeres.success) {
    return "Completá los antecedentes en mujeres";
  }

  return null;
}
