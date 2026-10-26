import { prisma } from "../config/prisma";
import type { CrearTamizajeInfeccionesInput } from "../types/tamizajeInfecciones.types";

const includeRelaciones = {
  resultados: { include: { determinacionSerologica: true } },
  donaciones: { include: { donacion: { include: { donante: true } } } },
} as const;

const categorias = {
  chagas: ["chagas", "anti t cruzi", "anti-t cruzi", "anti t. cruzi"],
  hbsag: ["hbsag"],
  antiHbc: ["anti hbc", "anti-hbc", "anti core hb", "anti-core hb"],
  antiHcv: ["anti hcv", "anti-hcv"],
  antiHiv: ["anti hiv", "anti-hiv", "anti vih 1/2", "anti-vih 1/2"],
  treponema: [
    "vdrl sifilis",
    "vdrl (sifilis)",
    "anti treponema pallidum",
    "anti-treponema pallidum",
  ],
  htlv: ["anti htlv i/ii", "anti-htlv i/ii"],
} as const;

type Categoria = keyof typeof categorias;
type Determinacion = { id: number; nombre: string };
type ResultadoHistorico = {
  determinacionSerologicaId: number;
  resultado: string;
};
type SerologiaHistorica = {
  fecha: Date;
  resultados: ResultadoHistorico[];
  donaciones: { donacionId: number }[];
};

type TamizajeTx = {
  donacion: {
    findUnique(args: unknown): Promise<any>;
    update(args: unknown): Promise<any>;
  };
  determinacionSerologica: {
    findMany(args: unknown): Promise<Determinacion[]>;
  };
  serologia: {
    create(args: unknown): Promise<any>;
    findMany(args: unknown): Promise<SerologiaHistorica[]>;
  };
};

type TamizajeDb = {
  $transaction<T>(callback: (tx: TamizajeTx) => Promise<T>): Promise<T>;
  serologia: {
    findMany(args: unknown): Promise<any[]>;
  };
};

const dbPredeterminada = prisma as unknown as TamizajeDb;

function normalizarNombre(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();
}

function categoriaDe(nombre: string): Categoria | null {
  const normalizado = normalizarNombre(nombre);
  return (
    (Object.entries(categorias).find(([, alias]) =>
      alias.some((nombreAlias) => normalizarNombre(nombreAlias) === normalizado),
    )?.[0] as Categoria | undefined) ?? null
  );
}

function esReactivo(resultado: string) {
  const normalizado = normalizarNombre(resultado).replace(/\s/g, "");
  return normalizado === "reactivo" || normalizado === "positivo";
}

export class DonacionNoEncontradaError extends Error {
  constructor() {
    super("La donación no existe.");
    this.name = "DonacionNoEncontradaError";
  }
}

export class CatalogoTamizajeInvalidoError extends Error {
  constructor() {
    super("El catálogo no contiene exactamente las siete pruebas de tamizaje requeridas. Ejecutá el seed del backend.");
    this.name = "CatalogoTamizajeInvalidoError";
  }
}

export async function crear(
  datos: CrearTamizajeInfeccionesInput,
  db: TamizajeDb = dbPredeterminada,
) {
  return db.$transaction(async (tx) => {
    const donacion = await tx.donacion.findUnique({
      where: { id: datos.donacionId },
      include: { donante: true },
    });

    if (!donacion) throw new DonacionNoEncontradaError();

    const ids = datos.resultados.map((resultado) => resultado.determinacionSerologicaId);
    const determinaciones = await tx.determinacionSerologica.findMany({
      where: { id: { in: ids } },
    });
    const categoriaPorId = new Map<number, Categoria>();

    for (const determinacion of determinaciones) {
      const categoria = categoriaDe(determinacion.nombre);
      if (categoria) categoriaPorId.set(determinacion.id, categoria);
    }

    if (
      determinaciones.length !== 7 ||
      categoriaPorId.size !== 7 ||
      new Set(categoriaPorId.values()).size !== 7
    ) {
      throw new CatalogoTamizajeInvalidoError();
    }

    const historial = await tx.serologia.findMany({
      where: {
        donaciones: {
          some: {
            donacion: { donanteId: donacion.donanteId },
          },
        },
      },
      include: { resultados: true, donaciones: true },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    });

    const donacionesPrevias = new Set(
      historial.flatMap((serologia) => serologia.donaciones.map((item) => item.donacionId)),
    );
    donacionesPrevias.delete(datos.donacionId);

    const ultimoResultadoPorCategoria = new Map<Categoria, string>();
    for (const serologia of historial) {
      if (!serologia.donaciones.some((item) => donacionesPrevias.has(item.donacionId))) {
        continue;
      }
      for (const resultado of serologia.resultados) {
        const categoria = categoriaPorId.get(resultado.determinacionSerologicaId);
        if (categoria && !ultimoResultadoPorCategoria.has(categoria)) {
          ultimoResultadoPorCategoria.set(categoria, resultado.resultado);
        }
      }
    }

    const reactivos = datos.resultados
      .filter((resultado) => resultado.resultado === "REACTIVO")
      .map((resultado) => ({
        categoria: categoriaPorId.get(resultado.determinacionSerologicaId)!,
        determinacion: determinaciones.find(
          (item) => item.id === resultado.determinacionSerologicaId,
        )!.nombre,
      }));
    const seroconversiones = reactivos.filter(
      ({ categoria }) =>
        ultimoResultadoPorCategoria.has(categoria) &&
        !esReactivo(ultimoResultadoPorCategoria.get(categoria)!),
    );

    const serologia = await tx.serologia.create({
      data: {
        fecha: datos.fecha,
        hora: new Date("1970-01-01T00:00:00.000Z"),
        observaciones: `Tamizaje de infecciones transmisibles. Operador: ${datos.operador}`,
        resultados: {
          create: datos.resultados.map((resultado) => ({
            determinacionSerologicaId: resultado.determinacionSerologicaId,
            resultado:
              resultado.resultado === "REACTIVO" ? "Reactivo" : "No reactivo",
            valor: null,
            unidad: null,
            observacion: null,
          })),
        },
        donaciones: { create: [{ donacionId: datos.donacionId }] },
      },
      include: includeRelaciones,
    });

    const estadoActual = donacion.estado;
    const bloqueada = estadoActual === "RECHAZADA" || reactivos.length > 0;
    const nuevoEstado = bloqueada
      ? "RECHAZADA"
      : estadoActual === "REGISTRADA"
        ? "EN_CALIFICACION"
        : estadoActual;

    if (nuevoEstado !== estadoActual) {
      await tx.donacion.update({
        where: { id: datos.donacionId },
        data: { estado: nuevoEstado },
      });
    }

    return {
      ...serologia,
      estadoDonacion: nuevoEstado,
      bloqueada,
      pruebasReactivas: reactivos.map((resultado) => resultado.determinacion),
      seroconversiones: seroconversiones.map((resultado) => resultado.determinacion),
      operador: datos.operador,
    };
  });
}

export async function listarPorDonacion(
  donacionId: number,
  db: TamizajeDb = dbPredeterminada,
) {
  return db.serologia.findMany({
    where: { donaciones: { some: { donacionId } } },
    include: includeRelaciones,
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
  });
}
