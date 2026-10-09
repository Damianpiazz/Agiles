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
}).superRefine((data, ctx) => {
  const comunes = respuestasComunesSchema.safeParse(data.respuestas);
  if (!comunes.success) {
    ctx.addIssue({
      code: "custom",
      path: ["respuestas"],
      message: "Completá todas las preguntas del cuestionario",
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
