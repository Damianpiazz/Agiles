import { z } from "zod";

export type SeccionCuestionario =
  | "Estado de salud general"
  | "Antecedentes recientes"
  | "Medicaciones actuales"
  | "Antecedentes médicos y patologías"
  | "Antecedentes en mujeres"
  | "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)"
  | "Preguntas de control y sinceridad";

export type PreguntaCuestionario = {
  clave: string;
  seccion: SeccionCuestionario;
  texto: string;
  soloMujeres?: boolean;
};

export const PREGUNTAS_CUESTIONARIO: PreguntaCuestionario[] = [
  {
    clave: "seSienteBienYSanoHoy",
    seccion: "Estado de salud general",
    texto: "¿Se siente bien y sano hoy?",
  },
  {
    clave: "leyoHojaInformativa",
    seccion: "Estado de salud general",
    texto: "¿Leyó la hoja informativa sobre la donación?",
  },
  {
    clave: "donoUltimas8Semanas",
    seccion: "Antecedentes recientes",
    texto: "¿Donó sangre en las últimas 8 semanas?",
  },
  {
    clave: "inconvenientesPosteriores",
    seccion: "Antecedentes recientes",
    texto: "¿Tuvo inconvenientes posteriores a una donación anterior?",
  },
  {
    clave: "rechazosPrevios",
    seccion: "Antecedentes recientes",
    texto: "¿Fue rechazado/a como donante en alguna oportunidad anterior?",
  },
  {
    clave: "antibioticos",
    seccion: "Medicaciones actuales",
    texto: "¿Está tomando antibióticos?",
  },
  {
    clave: "tratamientoAcne",
    seccion: "Medicaciones actuales",
    texto: "¿Está en tratamiento para acné?",
  },
  {
    clave: "tratamientoPsoriasis",
    seccion: "Medicaciones actuales",
    texto: "¿Está en tratamiento para psoriasis?",
  },
  {
    clave: "tratamientoProstata",
    seccion: "Medicaciones actuales",
    texto: "¿Está en tratamiento para próstata?",
  },
  {
    clave: "otrasMedicacionesRelevantes",
    seccion: "Medicaciones actuales",
    texto:
      "¿Está tomando otras medicaciones relevantes para la donación (por ejemplo, tratamientos mencionados por el médico entrevistador)?",
  },
  {
    clave: "patologiaCardiaca",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene o tuvo problemas cardíacos?",
  },
  {
    clave: "patologiaPulmonar",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene o tuvo problemas pulmonares?",
  },
  {
    clave: "patologiaNeurologicaEpilepsia",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene o tuvo problemas neurológicos o epilepsia?",
  },
  {
    clave: "cancer",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene o tuvo cáncer?",
  },
  {
    clave: "quimioterapiaRadioterapia",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Recibió quimioterapia o radioterapia?",
  },
  {
    clave: "hormonasCrecimiento",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Recibió hormonas de crecimiento?",
  },
  {
    clave: "problemasCoagulacion",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene problemas de coagulación?",
  },
  {
    clave: "sidaVih",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene SIDA/VIH o cree que podría tenerlo?",
  },
  {
    clave: "chagas",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene o tuvo enfermedad de Chagas?",
  },
  {
    clave: "hipertension",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Tiene hipertensión?",
  },
  {
    clave: "rabia",
    seccion: "Antecedentes médicos y patologías",
    texto: "¿Recibió tratamiento por rabia?",
  },
  {
    clave: "embarazoActual",
    seccion: "Antecedentes en mujeres",
    texto: "¿Está embarazada actualmente?",
    soloMujeres: true,
  },
  {
    clave: "partoAbortoCesareaUltimoAnio",
    seccion: "Antecedentes en mujeres",
    texto: "¿Tuvo parto, aborto o cesárea en el último año?",
    soloMujeres: true,
  },
  {
    clave: "relacionesSexualesRiesgo",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Tuvo relaciones sexuales de riesgo en los últimos 12 meses?",
  },
  {
    clave: "parejasMultiples",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Tuvo múltiples parejas sexuales en los últimos 12 meses?",
  },
  {
    clave: "drogasInyectablesCocaina",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Usó drogas inyectables o cocaína en los últimos 12 meses?",
  },
  {
    clave: "its",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Tuvo una infección de transmisión sexual en los últimos 12 meses?",
  },
  {
    clave: "tatuajes",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Se realizó tatuajes en los últimos 12 meses?",
  },
  {
    clave: "piercings",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Se realizó piercings en los últimos 12 meses?",
  },
  {
    clave: "acupuntura",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Se realizó acupuntura en los últimos 12 meses?",
  },
  {
    clave: "cirugias",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Se realizó cirugías en los últimos 12 meses?",
  },
  {
    clave: "endoscopias",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Se realizó endoscopias en los últimos 12 meses?",
  },
  {
    clave: "transfusiones",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Recibió transfusiones en los últimos 12 meses?",
  },
  {
    clave: "trasplantes",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Recibió un trasplante en los últimos 12 meses?",
  },
  {
    clave: "exposicionSangre",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto:
      "¿Tuvo exposición laboral o accidental a sangre en los últimos 12 meses?",
  },
  {
    clave: "detencionesCarcelarias",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto: "¿Estuvo detenido/a en una cárcel en los últimos 12 meses?",
  },
  {
    clave: "viajesZonasEndemicas",
    seccion: "Conductas, prácticas de riesgo e infecciones (últimos 12 meses)",
    texto:
      "¿Viajó a zonas endémicas (por ejemplo paludismo/malaria) en los últimos 12 meses?",
  },
  {
    clave: "donaParaPruebaVih",
    seccion: "Preguntas de control y sinceridad",
    texto: "¿Dona para hacerse la prueba de VIH/SIDA?",
  },
  {
    clave: "recibioCompensacionEconomica",
    seccion: "Preguntas de control y sinceridad",
    texto: "¿Recibió o le ofrecieron compensación económica por donar?",
  },
];

export function preguntasParaSexo(sexo: "MASCULINO" | "FEMENINO") {
  return PREGUNTAS_CUESTIONARIO.filter(
    (pregunta) => sexo === "FEMENINO" || !pregunta.soloMujeres,
  );
}

export const entrevistaSchema = z.object({
  respuestas: z.record(z.string(), z.boolean()),
  resultadoAdmision: z.enum(["ADMITIDO", "DIFERIDO"], {
    error: "Seleccioná el resultado de la evaluación.",
  }),
  tipoDiferimiento: z.enum(["TEMPORAL", "PERMANENTE"]).optional(),
  causaDiferimiento: z.string().trim().optional(),
  entrevistador: z.string().trim().min(1, "Ingresá el nombre del personal entrevistador."),
}).superRefine((data, ctx) => {
  if (data.resultadoAdmision === "DIFERIDO") {
    if (!data.tipoDiferimiento) {
      ctx.addIssue({
        code: "custom",
        path: ["tipoDiferimiento"],
        message: "Indicá si el diferimiento es temporal o permanente.",
      });
    }
    if (!data.causaDiferimiento) {
      ctx.addIssue({
        code: "custom",
        path: ["causaDiferimiento"],
        message: "Ingresá la causa del diferimiento.",
      });
    }
  } else if (data.tipoDiferimiento || data.causaDiferimiento) {
    ctx.addIssue({
      code: "custom",
      path: ["resultadoAdmision"],
      message: "Un donante admitido no puede tener datos de diferimiento.",
    });
  }
});

export type EntrevistaForm = z.infer<typeof entrevistaSchema>;
