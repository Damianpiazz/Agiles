import { prisma } from "../src/config/prisma";

/**
 * Datos de demostración para HU-018 (emitir sangre para transfusión).
 *
 * Escenario con prefijo "U-EMIS-" y paciente DNI "35900180":
 *  - Solicitud 1 (APROBADA, PROGRAMADA, cantidad 2):
 *      - U-EMIS-01: RESERVADA con prueba cruzada COMPATIBLE (emite OK sin advertencias).
 *      - U-EMIS-02: RESERVADA con prueba cruzada INCOMPATIBLE (bloquea emisión, 409).
 *      - U-EMIS-03: RESERVADA sin prueba cruzada (emite con advertencia).
 *      - U-EMIS-04: EMITIDA con registro en EmisionUnidad (historial CA4 + prueba de baja).
 *  - Solicitud 2 (APROBADA, EMERGENCIA, cantidad 1):
 *      - U-EMIS-05: RESERVADA sin prueba cruzada (emite con leyenda normativa de emergencia).
 *  - Inventario extra para rechazos CA3:
 *      - U-EMIS-06: DISPONIBLE (no reservada → 409).
 *      - U-EMIS-07: DADA_DE_BAJA (no reservada → 409).
 *
 * Uso (dentro de Docker):
 *   docker compose exec api npm run db:seed:emision
 *   docker compose exec api npm run db:seed:emision:reset
 */

const DNI_DEMO = "35900180";
const OPERADOR_DEMO = "Téc. Sofía Navarro";
const MEDICO_STH_DEMO = "Dra. Laura Méndez";
const OBS_SOL_PROGRAMADA = "[SEED HU-018] Solicitud programada";
const OBS_SOL_EMERGENCIA = "[SEED HU-018] Solicitud emergencia";

function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + cantidad);
  return new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()),
  );
}

function haceHoras(cantidad: number): Date {
  return new Date(Date.now() - cantidad * 60 * 60 * 1000);
}

async function obtenerOSolicitud(
  pacienteId: number,
  observaciones: string,
  caracter: "PROGRAMADA" | "EMERGENCIA",
  cantidad: number,
  reset: boolean,
) {
  const existente = await prisma.solicitudTransfusion.findFirst({
    where: { dniPaciente: DNI_DEMO, observaciones },
  });

  const data = {
    pacienteId,
    dniPaciente: DNI_DEMO,
    nombrePaciente: "Martín Gómez",
    grupoABO: "A" as const,
    factorRhD: "POSITIVO" as const,
    tipoHemocomponente: "GLOBULOS_ROJOS" as const,
    cantidad,
    estado: "APROBADA" as const,
    caracter,
    irradiado: caracter === "PROGRAMADA",
    desleucocitado: caracter === "PROGRAMADA",
    operador: OPERADOR_DEMO,
    aprobadaPor: MEDICO_STH_DEMO,
    fechaHoraAprobacion: haceHoras(3),
    opinionMedica:
      caracter === "EMERGENCIA"
        ? "Aprobada en carácter de emergencia"
        : "Indicación validada para cirugía programada",
    observaciones,
  };

  if (existente) {
    if (reset) {
      return prisma.solicitudTransfusion.update({
        where: { id: existente.id },
        data,
      });
    }
    return existente;
  }

  return prisma.solicitudTransfusion.create({ data });
}

async function main() {
  const reset = process.argv.includes("--reset");

  const paciente = await prisma.paciente.upsert({
    where: { dni: DNI_DEMO },
    update: reset
      ? {
          nombre: "Martín",
          apellido: "Gómez",
          fechaNacimiento: new Date("1988-04-12T00:00:00.000Z"),
          operador: OPERADOR_DEMO,
        }
      : {},
    create: {
      nombre: "Martín",
      apellido: "Gómez",
      dni: DNI_DEMO,
      fechaNacimiento: new Date("1988-04-12T00:00:00.000Z"),
      operador: OPERADOR_DEMO,
    },
  });

  const solProgramada = await obtenerOSolicitud(
    paciente.id,
    OBS_SOL_PROGRAMADA,
    "PROGRAMADA",
    2,
    reset,
  );
  const solEmergencia = await obtenerOSolicitud(
    paciente.id,
    OBS_SOL_EMERGENCIA,
    "EMERGENCIA",
    1,
    reset,
  );

  const unidadesDemo = [
    {
      numeroUnidad: "U-EMIS-01",
      grupoABO: "A" as const,
      factorRhD: "POSITIVO" as const,
      dias: 25,
      estado: "RESERVADA" as const,
      solicitudId: solProgramada.id,
      reservadaPor: OPERADOR_DEMO,
      reservadaEn: haceHoras(2),
    },
    {
      numeroUnidad: "U-EMIS-02",
      grupoABO: "O" as const,
      factorRhD: "POSITIVO" as const,
      dias: 22,
      estado: "RESERVADA" as const,
      solicitudId: solProgramada.id,
      reservadaPor: OPERADOR_DEMO,
      reservadaEn: haceHoras(2),
    },
    {
      numeroUnidad: "U-EMIS-03",
      grupoABO: "A" as const,
      factorRhD: "NEGATIVO" as const,
      dias: 20,
      estado: "RESERVADA" as const,
      solicitudId: solProgramada.id,
      reservadaPor: OPERADOR_DEMO,
      reservadaEn: haceHoras(1),
    },
    {
      numeroUnidad: "U-EMIS-04",
      grupoABO: "A" as const,
      factorRhD: "POSITIVO" as const,
      dias: 18,
      estado: "EMITIDA" as const,
      solicitudId: solProgramada.id,
      reservadaPor: OPERADOR_DEMO,
      reservadaEn: haceHoras(4),
    },
    {
      numeroUnidad: "U-EMIS-05",
      grupoABO: "O" as const,
      factorRhD: "NEGATIVO" as const,
      dias: 30,
      estado: "RESERVADA" as const,
      solicitudId: solEmergencia.id,
      reservadaPor: OPERADOR_DEMO,
      reservadaEn: haceHoras(1),
    },
    {
      numeroUnidad: "U-EMIS-06",
      grupoABO: "A" as const,
      factorRhD: "POSITIVO" as const,
      dias: 28,
      estado: "DISPONIBLE" as const,
      solicitudId: null,
      reservadaPor: null,
      reservadaEn: null,
    },
    {
      numeroUnidad: "U-EMIS-07",
      grupoABO: "A" as const,
      factorRhD: "POSITIVO" as const,
      dias: 15,
      estado: "DADA_DE_BAJA" as const,
      solicitudId: null,
      reservadaPor: null,
      reservadaEn: null,
      motivoBaja: "DESCARTADA" as const,
      operadorBaja: OPERADOR_DEMO,
      fechaBaja: haceHoras(6),
    },
  ];

  const unidadesGuardadas = new Map<string, { id: number; fechaVencimiento: Date }>();

  for (const item of unidadesDemo) {
    const data = {
      numeroUnidad: item.numeroUnidad,
      tipoHemocomponente: "GLOBULOS_ROJOS" as const,
      grupoABO: item.grupoABO,
      factorRhD: item.factorRhD,
      fechaVencimiento: enDias(item.dias),
      estado: item.estado,
      operador: OPERADOR_DEMO,
      solicitudId: item.solicitudId,
      reservadaPor: item.reservadaPor,
      reservadaEn: item.reservadaEn,
      motivoBaja: "motivoBaja" in item ? (item.motivoBaja ?? null) : null,
      operadorBaja: "operadorBaja" in item ? (item.operadorBaja ?? null) : null,
      fechaBaja: "fechaBaja" in item ? (item.fechaBaja ?? null) : null,
    };

    const guardada = await prisma.unidadSangre.upsert({
      where: { numeroUnidad: item.numeroUnidad },
      update: reset ? data : {},
      create: data,
    });
    unidadesGuardadas.set(item.numeroUnidad, {
      id: guardada.id,
      fechaVencimiento: guardada.fechaVencimiento,
    });
  }

  const idsDemo = [...unidadesGuardadas.values()].map((u) => u.id);

  if (reset) {
    await prisma.emisionUnidad.deleteMany({
      where: { unidadSangreId: { in: idsDemo } },
    });
    await prisma.estudioPretransfusional.deleteMany({
      where: {
        solicitudId: { in: [solProgramada.id, solEmergencia.id] },
      },
    });
  }

  const u01 = unidadesGuardadas.get("U-EMIS-01")!;
  const u02 = unidadesGuardadas.get("U-EMIS-02")!;
  const u04 = unidadesGuardadas.get("U-EMIS-04")!;

  const existePrueba01 = await prisma.estudioPretransfusional.findFirst({
    where: {
      solicitudId: solProgramada.id,
      unidadSangreId: u01.id,
      tipo: "PRUEBA_CRUZADA",
    },
  });
  if (!existePrueba01) {
    await prisma.estudioPretransfusional.create({
      data: {
        solicitudId: solProgramada.id,
        unidadSangreId: u01.id,
        tipo: "PRUEBA_CRUZADA",
        resultado: "Compatible sin aglutinación",
        compatibilidad: "COMPATIBLE",
        operador: OPERADOR_DEMO,
      },
    });
  }

  const existePrueba02 = await prisma.estudioPretransfusional.findFirst({
    where: {
      solicitudId: solProgramada.id,
      unidadSangreId: u02.id,
      tipo: "PRUEBA_CRUZADA",
    },
  });
  if (!existePrueba02) {
    await prisma.estudioPretransfusional.create({
      data: {
        solicitudId: solProgramada.id,
        unidadSangreId: u02.id,
        tipo: "PRUEBA_CRUZADA",
        resultado: "Aglutinación positiva en fase antiglobulina",
        compatibilidad: "INCOMPATIBLE",
        operador: OPERADOR_DEMO,
      },
    });
  }

  const existeEmision04 = await prisma.emisionUnidad.findFirst({
    where: { unidadSangreId: u04.id, solicitudId: solProgramada.id },
  });
  if (!existeEmision04) {
    await prisma.emisionUnidad.create({
      data: {
        unidadSangreId: u04.id,
        solicitudId: solProgramada.id,
        pacienteId: paciente.id,
        dniPaciente: DNI_DEMO,
        nombrePaciente: "Martín Gómez",
        grupoABOReceptor: "A",
        factorRhDReceptor: "POSITIVO",
        numeroUnidad: "U-EMIS-04",
        tipoHemocomponente: "GLOBULOS_ROJOS",
        grupoABOUnidad: "A",
        factorRhDUnidad: "POSITIVO",
        fechaVencimientoUnidad: u04.fechaVencimiento,
        caracter: "PROGRAMADA",
        requisitosEspeciales: "Irradiado, Desleucocitado",
        resultadoCompatibilidad: "COMPATIBLE",
        compatibilidadCompleta: true,
        responsable: OPERADOR_DEMO,
        observaciones: "Emisión inicial de demo (CA4)",
        fechaHora: haceHoras(1),
      },
    });
  }

  console.log(
    `Seed HU-018 OK: paciente DNI ${DNI_DEMO}, solicitudes #${solProgramada.id} (PROGRAMADA) y #${solEmergencia.id} (EMERGENCIA), 7 unidades U-EMIS-01..07.`,
  );
  if (reset) {
    console.log("Modo --reset: escenario HU-018 restaurado al estado inicial.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
