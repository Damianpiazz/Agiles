import { prisma } from "../../config/prisma";
import { parseDateRange, type RawQuery } from "../../lib/query";
import { clasificarResultado } from "../personas/personas.service";

export type AptitudCodigo = "APTO" | "REVISAR" | "EXCLUIDO" | "SIN_ESTUDIOS";

const ETIQUETA_APTITUD: Record<AptitudCodigo, string> = {
  APTO: "Apto",
  REVISAR: "En revisión",
  EXCLUIDO: "Excluido",
  SIN_ESTUDIOS: "Sin estudios",
};

const ETIQUETA_TIPO_HEMOCOMPONENTE: Record<string, string> = {
  GLOBULOS_ROJOS: "Glóbulos rojos",
  PLASMA: "Plasma",
  PLAQUETAS: "Plaquetas",
  CRIOPRECIPITADO: "Crioprecipitado",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  BLOQUEADA: "Bloqueada",
  VENCIDA: "Vencida",
  DADA_DE_BAJA: "Dada de baja",
};

const ESTADOS_DESCARTE = ["DADA_DE_BAJA", "VENCIDA"] as const;

type DonacionConSerologias = {
  id: number;
  fecha: Date | null;
  voluntario: boolean | null;
  reposicion: boolean | null;
  autoexcluido: boolean | null;
  persona: {
    id: number;
    dni: string | null;
    nombre: string | null;
    apellido: string | null;
    telefono: string | null;
    fechaNacimiento: Date | null;
    grupoFactor: { grupo: string | null; factor: string | null } | null;
  } | null;
  serologiaDonaciones: Array<{
    serologia: {
      tipoMuestra: string | null;
      resultados: Array<{ resultado: string }>;
    };
  }>;
};

function aFechaISO(fecha: Date | null | undefined): string {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

function mesDe(fecha: Date | null | undefined): string {
  return fecha ? fecha.toISOString().slice(0, 7) : "sin-fecha";
}

/** Interpreta respuestas afirmativas cargadas como texto libre. */
function esSi(valor: string | null | undefined): boolean {
  if (!valor) return false;
  return /^(s[ií]|true|1|x|positivo)/i.test(valor.trim());
}

function etiquetaGrupoFactor(grupoFactor: { grupo: string | null; factor: string | null } | null): string {
  if (!grupoFactor) return "Sin dato";
  const texto = `${grupoFactor.grupo ?? ""}${grupoFactor.factor ?? ""}`.trim();
  return texto || "Sin dato";
}

function nombrePersona(persona: { apellido: string | null; nombre: string | null } | null): string {
  if (!persona) return "Sin persona";
  return [persona.apellido, persona.nombre].filter(Boolean).join(", ") || "Sin nombre";
}

function rangoDe(query: RawQuery): { gte?: Date; lte?: Date } | undefined {
  const rango = parseDateRange(query);
  if (!rango.gte && !rango.lte) return undefined;
  return rango;
}

/** Determina la aptitud de una donación a partir de sus serologías. */
export function aptitudDeDonacion(donacion: DonacionConSerologias): AptitudCodigo {
  if (donacion.autoexcluido) return "EXCLUIDO";

  const resultados = donacion.serologiaDonaciones.flatMap((item) =>
    item.serologia.resultados.map((resultado) => clasificarResultado(resultado.resultado)),
  );

  if (resultados.length === 0) return "SIN_ESTUDIOS";
  if (resultados.includes("REACTIVO")) return "EXCLUIDO";
  if (resultados.includes("DUDOSO")) return "REVISAR";
  return "APTO";
}

function clasificarTolerancia(tolerancia: string | null): "CON_REACCION" | "SIN_REACCION" | "SIN_DATOS" {
  if (!tolerancia || !tolerancia.trim()) return "SIN_DATOS";
  const texto = tolerancia.trim().toLowerCase();
  if (/(buena|satisfactoria|adecuada|sin\s+reacci|no\s+hubo|sin\s+particular)/.test(texto)) {
    return "SIN_REACCION";
  }
  if (/(reacci|febril|al[eé]rgic|hemol[ií]tic|urticaria|escalofr[ií]o|anafil)/.test(texto)) {
    return "CON_REACCION";
  }
  return "SIN_REACCION";
}

function datosDonaciones(query: RawQuery) {
  const fecha = rangoDe(query);
  return prisma.donacionDer.findMany({
    where: fecha ? { fecha } : undefined,
    select: {
      id: true,
      fecha: true,
      voluntario: true,
      reposicion: true,
      autoexcluido: true,
      persona: {
        select: {
          id: true,
          dni: true,
          nombre: true,
          apellido: true,
          telefono: true,
          fechaNacimiento: true,
          grupoFactor: { select: { grupo: true, factor: true } },
        },
      },
      serologiaDonaciones: {
        select: {
          serologia: {
            select: {
              tipoMuestra: true,
              resultados: { select: { resultado: true } },
            },
          },
        },
      },
    },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });
}

/** HEMO 1 · Donantes atendidos y aptitud. */
export async function reporteHemo1(query: RawQuery) {
  const donaciones = (await datosDonaciones(query)) as DonacionConSerologias[];

  const porAptitud: Record<AptitudCodigo, number> = {
    APTO: 0,
    REVISAR: 0,
    EXCLUIDO: 0,
    SIN_ESTUDIOS: 0,
  };
  const porTipoDonante: Record<string, number> = { voluntario: 0, reposicion: 0, otro: 0 };
  const porGrupoFactor: Record<string, number> = {};
  const donantes = new Set<number>();

  const detalle = donaciones.map((donacion) => {
    const aptitud = aptitudDeDonacion(donacion);
    porAptitud[aptitud] += 1;
    if (donacion.persona) donantes.add(donacion.persona.id);

    if (donacion.voluntario) porTipoDonante.voluntario += 1;
    else if (donacion.reposicion) porTipoDonante.reposicion += 1;
    else porTipoDonante.otro += 1;

    const grupoFactor = etiquetaGrupoFactor(donacion.persona?.grupoFactor ?? null);
    porGrupoFactor[grupoFactor] = (porGrupoFactor[grupoFactor] ?? 0) + 1;

    return {
      id: donacion.id,
      fecha: aFechaISO(donacion.fecha),
      dni: donacion.persona?.dni ?? "",
      paciente: nombrePersona(donacion.persona),
      telefono: donacion.persona?.telefono ?? "",
      grupoFactor,
      voluntario: donacion.voluntario ? "Sí" : "No",
      reposicion: donacion.reposicion ? "Sí" : "No",
      autoexcluido: donacion.autoexcluido ? "Sí" : "No",
      aptitud,
      aptitudEtiqueta: ETIQUETA_APTITUD[aptitud],
    };
  });

  return {
    totales: {
      donaciones: donaciones.length,
      donantesUnicos: donantes.size,
    },
    porAptitud: Object.entries(porAptitud).map(([codigo, cantidad]) => ({
      codigo,
      etiqueta: ETIQUETA_APTITUD[codigo as AptitudCodigo],
      cantidad,
    })),
    porTipoDonante,
    porGrupoFactor,
    detalle,
  };
}

/** HEMO 2 · Hemocomponentes obtenidos y descartes. */
export async function reporteHemo2(query: RawQuery) {
  const fechaRecepcion = rangoDe(query);
  const unidades = await prisma.unidadSangre.findMany({
    where: fechaRecepcion ? { fechaRecepcion } : undefined,
    select: {
      numeroUnidad: true,
      tipoHemocomponente: true,
      grupoABO: true,
      factorRhD: true,
      estado: true,
      fechaRecepcion: true,
      fechaVencimiento: true,
    },
    orderBy: [{ fechaRecepcion: "desc" }, { id: "desc" }],
  });

  const porTipo = new Map<string, Record<string, number>>();
  const totales = {
    recibidas: unidades.length,
    disponibles: 0,
    reservadas: 0,
    bloqueadas: 0,
    vencidas: 0,
    dadasDeBaja: 0,
    descartadas: 0,
  };

  for (const unidad of unidades) {
    const tipo = unidad.tipoHemocomponente;
    const fila = porTipo.get(tipo) ?? { recibidas: 0, descartadas: 0 };
    fila.recibidas += 1;

    switch (unidad.estado) {
      case "DISPONIBLE":
        totales.disponibles += 1;
        break;
      case "RESERVADA":
        totales.reservadas += 1;
        break;
      case "BLOQUEADA":
        totales.bloqueadas += 1;
        break;
      case "VENCIDA":
        totales.vencidas += 1;
        break;
      case "DADA_DE_BAJA":
        totales.dadasDeBaja += 1;
        break;
    }

    if ((ESTADOS_DESCARTE as readonly string[]).includes(unidad.estado)) {
      totales.descartadas += 1;
      fila.descartadas += 1;
    }

    porTipo.set(tipo, fila);
  }

  return {
    totales,
    porTipoHemocomponente: [...porTipo.entries()].map(([tipo, datos]) => ({
      tipo,
      etiqueta: ETIQUETA_TIPO_HEMOCOMPONENTE[tipo] ?? tipo,
      ...datos,
    })),
    detalle: unidades.map((unidad) => ({
      numeroUnidad: unidad.numeroUnidad,
      tipo: unidad.tipoHemocomponente,
      grupoFactor: `${unidad.grupoABO} ${unidad.factorRhD}`.trim(),
      estado: unidad.estado,
      estadoEtiqueta: ETIQUETA_ESTADO[unidad.estado] ?? unidad.estado,
      fechaRecepcion: aFechaISO(unidad.fechaRecepcion),
      fechaVencimiento: aFechaISO(unidad.fechaVencimiento),
    })),
  };
}

/** HEMO 3 · Transfusiones realizadas. */
export async function reporteHemo3(query: RawQuery) {
  const fecha = rangoDe(query);
  const transfusiones = await prisma.transfusion.findMany({
    where: fecha ? { fecha } : undefined,
    select: {
      id: true,
      fecha: true,
      numeroOLote: true,
      rt: true,
      tolerancia: true,
      tecnico: true,
      persona: {
        select: {
          dni: true,
          nombre: true,
          apellido: true,
          grupoFactor: { select: { grupo: true, factor: true } },
        },
      },
      grupoFactor: { select: { grupo: true, factor: true } },
      tipoTransfusion: { select: { nombre: true } },
      fenotipo1: { select: { nombre: true } },
      fenotipo2: { select: { nombre: true } },
    },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });

  const porTipoTransfusion: Record<string, number> = {};
  const porGrupoFactor: Record<string, number> = {};
  const porMes: Record<string, number> = {};

  const detalle = transfusiones.map((transfusion) => {
    const tipo = transfusion.tipoTransfusion?.nombre ?? "Sin tipo";
    const grupoFactor = etiquetaGrupoFactor(
      transfusion.grupoFactor ?? transfusion.persona?.grupoFactor ?? null,
    );
    porTipoTransfusion[tipo] = (porTipoTransfusion[tipo] ?? 0) + 1;
    porGrupoFactor[grupoFactor] = (porGrupoFactor[grupoFactor] ?? 0) + 1;
    porMes[mesDe(transfusion.fecha)] = (porMes[mesDe(transfusion.fecha)] ?? 0) + 1;

    return {
      id: transfusion.id,
      fecha: aFechaISO(transfusion.fecha),
      dni: transfusion.persona?.dni ?? "",
      paciente: nombrePersona(transfusion.persona),
      grupoFactor,
      tipo,
      fenotipo: [transfusion.fenotipo1?.nombre, transfusion.fenotipo2?.nombre]
        .filter(Boolean)
        .join(" / "),
      numeroOLote: transfusion.numeroOLote ?? "",
      rt: transfusion.rt ?? "",
      tolerancia: transfusion.tolerancia ?? "",
      tecnico: transfusion.tecnico ?? "",
    };
  });

  return {
    totales: { transfusiones: transfusiones.length },
    porTipoTransfusion,
    porGrupoFactor,
    porMes,
    detalle,
  };
}

/** HEMO 4 · Reacciones adversas registradas durante la transfusión. */
export async function reporteHemo4(query: RawQuery) {
  const fecha = rangoDe(query);
  const transfusiones = await prisma.transfusion.findMany({
    where: fecha ? { fecha } : undefined,
    select: {
      id: true,
      fecha: true,
      tolerancia: true,
      persona: { select: { dni: true, nombre: true, apellido: true } },
      tipoTransfusion: { select: { nombre: true } },
    },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });

  const totales = { conReaccion: 0, sinReaccion: 0, sinDatos: 0 };

  const detalle = transfusiones.map((transfusion) => {
    const clasificacion = clasificarTolerancia(transfusion.tolerancia);
    if (clasificacion === "CON_REACCION") totales.conReaccion += 1;
    else if (clasificacion === "SIN_REACCION") totales.sinReaccion += 1;
    else totales.sinDatos += 1;

    return {
      id: transfusion.id,
      fecha: aFechaISO(transfusion.fecha),
      dni: transfusion.persona?.dni ?? "",
      paciente: nombrePersona(transfusion.persona),
      tipo: transfusion.tipoTransfusion?.nombre ?? "Sin tipo",
      tolerancia: transfusion.tolerancia ?? "",
      clasificacion,
    };
  });

  return {
    totales: { ...totales, transfusiones: transfusiones.length },
    detalle,
  };
}

/** HEMO 5 · Gestantes y recién nacidos estudiados. */
export async function reporteHemo5(query: RawQuery) {
  const fecha = rangoDe(query);
  const [gestantes, recienNacidos] = await Promise.all([
    prisma.estudioInmunohematologicoGestante.findMany({
      where: fecha ? { fecha } : undefined,
      select: {
        id: true,
        numero: true,
        fecha: true,
        operador: true,
        gestante: {
          select: {
            dni: true,
            nombre: true,
            apellido: true,
            telefono: true,
            grupoFactor: { select: { grupo: true, factor: true } },
          },
        },
        pciAsociados: {
          select: {
            pci: { select: { resultados: { select: { resultado: true } } } },
          },
        },
      },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    }),
    prisma.estudioInmunohematologicoRn.findMany({
      where: fecha ? { fecha } : undefined,
      select: {
        id: true,
        numero: true,
        fecha: true,
        rn: true,
        dni: true,
        ipAntiD: true,
        operador: true,
        observaciones: true,
        grupoFactor: { select: { grupo: true, factor: true } },
        madre: {
          select: {
            dni: true,
            nombre: true,
            apellido: true,
            grupoFactor: { select: { grupo: true, factor: true } },
          },
        },
      },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    }),
  ]);

  let gestantesConPciPositivo = 0;
  let recienNacidosConProfilaxis = 0;

  const detalleGestantes = gestantes.map((estudio) => {
    const resultados = estudio.pciAsociados.flatMap((item) =>
      item.pci.resultados.map((resultado) => resultado.resultado),
    );
    const pciPositivo = resultados.some((resultado) => clasificarResultado(resultado) === "REACTIVO");
    if (pciPositivo) gestantesConPciPositivo += 1;

    return {
      tipo: "Gestante",
      id: estudio.id,
      numero: estudio.numero ?? "",
      fecha: aFechaISO(estudio.fecha),
      dni: estudio.gestante.dni ?? "",
      paciente: nombrePersona(estudio.gestante),
      grupoFactor: etiquetaGrupoFactor(estudio.gestante.grupoFactor),
      pci: pciPositivo ? "Positivo" : "Negativo",
      operador: estudio.operador ?? "",
      observaciones: "",
    };
  });

  const detalleRecienNacidos = recienNacidos.map((estudio) => {
    if (esSi(estudio.ipAntiD)) recienNacidosConProfilaxis += 1;

    return {
      tipo: "Recién nacido",
      id: estudio.id,
      numero: estudio.numero ?? "",
      fecha: aFechaISO(estudio.fecha),
      dni: estudio.dni ?? "",
      paciente: estudio.rn ?? "Recién nacido",
      grupoFactor: etiquetaGrupoFactor(estudio.grupoFactor),
      pci: estudio.ipAntiD ? `IP anti-D: ${estudio.ipAntiD}` : "",
      operador: estudio.operador ?? "",
      observaciones: estudio.observaciones ?? "",
      madreDni: estudio.madre?.dni ?? "",
      madre: nombrePersona(estudio.madre),
      grupoFactorMadre: etiquetaGrupoFactor(estudio.madre?.grupoFactor ?? null),
    };
  });

  return {
    totales: {
      gestantes: gestantes.length,
      recienNacidos: recienNacidos.length,
      gestantesConPciPositivo,
      recienNacidosConProfilaxis,
    },
    detalle: [...detalleGestantes, ...detalleRecienNacidos],
  };
}

/** Resumen mostrado en las tarjetas de la pantalla 07. */
export async function resumenHemo(query: RawQuery) {
  const fecha = rangoDe(query);
  const [hemo1, hemo2, transfusiones, hemo5, sangrias] = await Promise.all([
    reporteHemo1(query),
    reporteHemo2(query),
    prisma.transfusion.count({ where: fecha ? { fecha } : undefined }),
    reporteHemo5(query),
    prisma.sangriaTerapeutica.count({ where: fecha ? { fecha } : undefined }),
  ]);

  const aptos = hemo1.porAptitud.find((item) => item.codigo === "APTO")?.cantidad ?? 0;
  const excluidos = hemo1.porAptitud.find((item) => item.codigo === "EXCLUIDO")?.cantidad ?? 0;
  const enRevision = hemo1.porAptitud.find((item) => item.codigo === "REVISAR")?.cantidad ?? 0;

  return {
    donantesAtendidos: hemo1.totales.donaciones,
    donantesUnicos: hemo1.totales.donantesUnicos,
    hemocomponentesTransfundidos: transfusiones,
    unidadesDescartadas: hemo2.totales.descartadas,
    gestantesEstudiadas: hemo5.totales.gestantes,
    recienNacidosEstudiados: hemo5.totales.recienNacidos,
    sangriasTerapeuticas: sangrias,
    aptitud: { aptos, excluidos, enRevision },
  };
}
