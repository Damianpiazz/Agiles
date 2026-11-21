import { prisma } from "../src/config/prisma";

/**
 * Datos de demostración para HU-023 (dar de baja unidades).
 *
 * Crea unidades con el prefijo "U-BAJA-" en distintos estados para poder
 * ejercitar el flujo completo:
 *
 *  - DISPONIBLE: unidades listas para dar de baja (CA1, CA2, CA3).
 *  - RESERVADA:  unidad reservada por una solicitud aprobada (caso límite conocido).
 *  - BLOQUEADA:  unidad bloqueada que también puede darse de baja.
 *  - DADA_DE_BAJA: unidades ya dadas de baja con su motivo, operador y fecha/hora,
 *    para ver la trazabilidad (CA5) y comprobar que no se pueden reutilizar (CA4).
 *
 * Es idempotente: usa `upsert` por `numeroUnidad` y no toca otras unidades.
 *
 * Uso:
 *   npm run db:seed:baja         # crea lo que falte (no pisa lo existente)
 *   npm run db:seed:baja:reset   # restaura el estado de demo (para repetir la prueba)
 */

type TipoHemocomponente =
  | "GLOBULOS_ROJOS"
  | "PLASMA"
  | "PLAQUETAS"
  | "CRIOPRECIPITADO";

type EstadoUnidadSangre =
  | "DISPONIBLE"
  | "RESERVADA"
  | "BLOQUEADA"
  | "VENCIDA"
  | "DADA_DE_BAJA";

type MotivoBajaUnidad = "VENCIDA" | "TRANSFUNDIDA" | "DESCARTADA";

type UnidadDemo = {
  numeroUnidad: string;
  grupoABO: "A" | "B" | "AB" | "O";
  factorRhD: "POSITIVO" | "NEGATIVO";
  dias: number;
  estado: EstadoUnidadSangre;
  tipoHemocomponente?: TipoHemocomponente;
  motivoBaja?: MotivoBajaUnidad;
  operadorBaja?: string;
  fechaBaja?: Date;
  reservadaPor?: string;
  reservadaEn?: Date;
  solicitudId?: number;
};

const OPERADOR_DEMO = "Damian Piazza";

function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + cantidad);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function haceHoras(cantidad: number): Date {
  return new Date(Date.now() - cantidad * 60 * 60 * 1000);
}

/**
 * Devuelve una solicitud aprobada para poder dejar una unidad RESERVADA.
 * Reutiliza la del seed general si existe.
 */
async function obtenerSolicitudAprobada() {
  const existente = await prisma.solicitudTransfusion.findFirst({
    where: { dniPaciente: "30111222", estado: "APROBADA" },
  });
  if (existente) return existente;

  return prisma.solicitudTransfusion.create({
    data: {
      dniPaciente: "30111222",
      nombrePaciente: "Lucia Fernandez",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      tipoHemocomponente: "GLOBULOS_ROJOS",
      cantidad: 2,
      estado: "APROBADA",
      operador: OPERADOR_DEMO,
      observaciones: "Datos de demo para HU-023 (dar de baja unidad)",
    },
  });
}

async function main() {
  const reset = process.argv.includes("--reset");

  const solicitud = await obtenerSolicitudAprobada();

  const unidades: UnidadDemo[] = [
    // --- Listas para dar de baja (CA1, CA2, CA3) ---
    { numeroUnidad: "U-BAJA-01", grupoABO: "A", factorRhD: "POSITIVO", dias: 30, estado: "DISPONIBLE" },
    { numeroUnidad: "U-BAJA-02", grupoABO: "O", factorRhD: "NEGATIVO", dias: 22, estado: "DISPONIBLE" },
    { numeroUnidad: "U-BAJA-03", grupoABO: "B", factorRhD: "POSITIVO", dias: 18, estado: "DISPONIBLE", tipoHemocomponente: "PLASMA" },
    { numeroUnidad: "U-BAJA-04", grupoABO: "AB", factorRhD: "POSITIVO", dias: 12, estado: "DISPONIBLE", tipoHemocomponente: "PLAQUETAS" },
    // --- Caso límite conocido: reservada por una solicitud aprobada ---
    {
      numeroUnidad: "U-BAJA-05",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      dias: 25,
      estado: "RESERVADA",
      reservadaPor: OPERADOR_DEMO,
      reservadaEn: haceHoras(2),
      solicitudId: solicitud.id,
    },
    // --- Bloqueada, también puede darse de baja ---
    { numeroUnidad: "U-BAJA-06", grupoABO: "O", factorRhD: "POSITIVO", dias: 8, estado: "BLOQUEADA" },
    // --- Ya dadas de baja: trazabilidad (CA5) y no reutilizables (CA4) ---
    {
      numeroUnidad: "U-BAJA-07",
      grupoABO: "A",
      factorRhD: "POSITIVO",
      dias: -3,
      estado: "DADA_DE_BAJA",
      motivoBaja: "VENCIDA",
      operadorBaja: OPERADOR_DEMO,
      fechaBaja: haceHoras(26),
    },
    {
      numeroUnidad: "U-BAJA-08",
      grupoABO: "O",
      factorRhD: "NEGATIVO",
      dias: 15,
      estado: "DADA_DE_BAJA",
      motivoBaja: "TRANSFUNDIDA",
      operadorBaja: "Laura Gomez",
      fechaBaja: haceHoras(5),
    },
    {
      numeroUnidad: "U-BAJA-09",
      grupoABO: "B",
      factorRhD: "NEGATIVO",
      dias: 40,
      estado: "DADA_DE_BAJA",
      motivoBaja: "DESCARTADA",
      operadorBaja: OPERADOR_DEMO,
      fechaBaja: haceHoras(48),
      tipoHemocomponente: "PLASMA",
    },
  ];

  for (const unidad of unidades) {
    const data = {
      numeroUnidad: unidad.numeroUnidad,
      tipoHemocomponente: unidad.tipoHemocomponente ?? "GLOBULOS_ROJOS",
      grupoABO: unidad.grupoABO,
      factorRhD: unidad.factorRhD,
      fechaVencimiento: enDias(unidad.dias),
      estado: unidad.estado,
      operador: OPERADOR_DEMO,
      motivoBaja: unidad.motivoBaja ?? null,
      operadorBaja: unidad.operadorBaja ?? null,
      fechaBaja: unidad.fechaBaja ?? null,
      reservadaPor: unidad.reservadaPor ?? null,
      reservadaEn: unidad.reservadaEn ?? null,
      solicitudId: unidad.solicitudId ?? null,
    };

    await prisma.unidadSangre.upsert({
      where: { numeroUnidad: unidad.numeroUnidad },
      // En modo normal no pisamos lo que ya exista; con --reset restauramos el estado de demo.
      update: reset ? data : {},
      create: data,
    });
  }

  const listas = unidades.filter((u) => u.estado === "DISPONIBLE").length;
  const dadasDeBaja = unidades.filter((u) => u.estado === "DADA_DE_BAJA").length;

  console.log(
    `Seed HU-023 OK: ${unidades.length} unidades de demo (${listas} disponibles para dar de baja, ${dadasDeBaja} ya dadas de baja).`,
  );
  if (reset) {
    console.log("Modo --reset: se restauró el estado inicial de las unidades U-BAJA-*.");
  }
  console.log("");
  console.log("Para probar:");
  console.log("  1. Levantá la base:    docker compose up -d db");
  console.log("  2. Aplicá migraciones: npx prisma migrate deploy      (dentro de backend/)");
  console.log("  3. Backend + frontend: npm run dev                    (backend/ y frontend/)");
  console.log("  4. En la UI, entrá a «Dar de baja unidad» y elegí una U-BAJA-01..06.");
  console.log("     - U-BAJA-07/08/09 ya están dadas de baja: no aparecen para seleccionar (CA4).");
  console.log("  5. Para repetir la prueba: npm run db:seed:baja:reset");
  console.log("");
  console.log("Nota: DATABASE_URL usa el host 'db', que solo resuelve dentro de Docker.");
  console.log("Si corrés el backend en tu máquina, cambiá el host a 'localhost' en backend/.env.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
