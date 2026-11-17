import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  ESTADOS_SOLICITUD,
  ESTADOS_UNIDAD,
  GRUPOS_ABO,
  HEMOCOMPONENTES,
  FACTORES_RH,
  apellido,
  dni,
  enDias,
  entero,
  fechaReciente,
  nombre,
  numeroUnidad,
  observacion,
  operador,
  pick,
  resetFake,
} from "./_fake";

export async function seed22SolicitudesYUnidades(prisma: PrismaClient) {
  resetFake(122);

  // Los IDs 1-3 se conservan: son las solicitudes de referencia de la demo.
  type SolicitudSeed = {
    id: number;
    dniPaciente: string;
    nombrePaciente: string;
    grupoABO: (typeof GRUPOS_ABO)[number];
    factorRhD: (typeof FACTORES_RH)[number];
    tipoHemocomponente: (typeof HEMOCOMPONENTES)[number];
    cantidad: number;
    estado: (typeof ESTADOS_SOLICITUD)[number];
    operador: string;
    observaciones: string | null;
    fechaHora: Date;
  };

  const solicitudesBase: SolicitudSeed[] = [
    {
      id: 1,
      dniPaciente: "30111222",
      nombrePaciente: "Lucía Fernández",
      grupoABO: "A" as const,
      factorRhD: "POSITIVO" as const,
      tipoHemocomponente: "GLOBULOS_ROJOS" as const,
      cantidad: 2,
      estado: "APROBADA" as const,
      operador: "Seeder",
      observaciones: "Cirugía programada",
      fechaHora: new Date("2026-10-08T08:30:00-03:00"),
    },
    {
      id: 2,
      dniPaciente: "28444555",
      nombrePaciente: "Marcos Gómez",
      grupoABO: "O" as const,
      factorRhD: "NEGATIVO" as const,
      tipoHemocomponente: "GLOBULOS_ROJOS" as const,
      cantidad: 1,
      estado: "APROBADA" as const,
      operador: "Seeder",
      observaciones: "Anemia crónica",
      fechaHora: new Date("2026-10-08T09:15:00-03:00"),
    },
    {
      id: 3,
      dniPaciente: "35999888",
      nombrePaciente: "Ana Sosa",
      grupoABO: "B" as const,
      factorRhD: "POSITIVO" as const,
      tipoHemocomponente: "GLOBULOS_ROJOS" as const,
      cantidad: 1,
      estado: "PENDIENTE" as const,
      operador: "Seeder",
      observaciones: "Pendiente de aprobación",
      fechaHora: new Date("2026-10-08T10:00:00-03:00"),
    },
  ];

  const solicitudes = [...solicitudesBase];
  for (let id = solicitudes.length + 1; id <= CANTIDAD; id++) {
    const nombreGenerado = nombre();
    const apellidoGenerado = apellido();
    solicitudes.push({
      id,
      dniPaciente: dni(),
      nombrePaciente: `${nombreGenerado} ${apellidoGenerado}`,
      grupoABO: pick(GRUPOS_ABO),
      factorRhD: pick(FACTORES_RH),
      tipoHemocomponente: pick(HEMOCOMPONENTES),
      cantidad: entero(1, 4),
      estado: pick(ESTADOS_SOLICITUD),
      operador: operador(),
      observaciones: observacion(),
      fechaHora: fechaReciente(),
    });
  }

  for (const solicitud of solicitudes) {
    await prisma.solicitudTransfusion.upsert({
      where: { id: solicitud.id },
      update: { ...solicitud },
      create: solicitud,
    });
  }

  // Unidades base: conservamos los números U-1001..U-1008 y sus estados demo.
  type UnidadSeed = {
    numeroUnidad: string;
    tipoHemocomponente?: (typeof HEMOCOMPONENTES)[number];
    grupoABO: (typeof GRUPOS_ABO)[number];
    factorRhD: (typeof FACTORES_RH)[number];
    dias: number;
    estado: (typeof ESTADOS_UNIDAD)[number];
  };

  const unidadesBase: UnidadSeed[] = [
    { numeroUnidad: "U-1001", grupoABO: "A", factorRhD: "POSITIVO", dias: 30, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1002", grupoABO: "O", factorRhD: "POSITIVO", dias: 25, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1003", grupoABO: "O", factorRhD: "NEGATIVO", dias: 20, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1004", grupoABO: "B", factorRhD: "POSITIVO", dias: 15, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1005", grupoABO: "AB", factorRhD: "NEGATIVO", dias: 10, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1006", grupoABO: "O", factorRhD: "NEGATIVO", dias: -5, estado: "VENCIDA" as const },
    { numeroUnidad: "U-1007", grupoABO: "A", factorRhD: "POSITIVO", dias: 40, estado: "BLOQUEADA" as const },
    {
      numeroUnidad: "U-1008",
      grupoABO: "O",
      factorRhD: "POSITIVO",
      dias: 30,
      estado: "DISPONIBLE" as const,
      tipoHemocomponente: "PLASMA" as const,
    },
  ];

  const unidades = [...unidadesBase];
  for (let i = unidades.length + 1; i <= CANTIDAD; i++) {
    unidades.push({
      numeroUnidad: numeroUnidad(),
      tipoHemocomponente: pick(HEMOCOMPONENTES),
      grupoABO: pick(GRUPOS_ABO),
      factorRhD: pick(FACTORES_RH),
      dias: entero(-5, 45),
      estado: pick(ESTADOS_UNIDAD),
    });
  }

  for (const unidad of unidades) {
    await prisma.unidadSangre.upsert({
      where: { numeroUnidad: unidad.numeroUnidad },
      update: {},
      create: {
        numeroUnidad: unidad.numeroUnidad,
        tipoHemocomponente: unidad.tipoHemocomponente ?? "GLOBULOS_ROJOS",
        grupoABO: unidad.grupoABO,
        factorRhD: unidad.factorRhD,
        fechaVencimiento: enDias(unidad.dias),
        estado: unidad.estado,
        operador: operador(),
      },
    });
  }

  console.log(`22-solicitudes-y-unidades: ${solicitudes.length} solicitudes, ${unidades.length} unidades`);
}
