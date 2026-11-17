import type { PrismaClient } from "../../generated/prisma/client";

function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + cantidad);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export async function seed22SolicitudesYUnidades(prisma: PrismaClient) {
  const solicitudesExistentes = await prisma.solicitudTransfusion.count();

  if (solicitudesExistentes === 0) {
    await prisma.solicitudTransfusion.createMany({
      data: [
        {
          dniPaciente: "30111222",
          nombrePaciente: "Lucía Fernández",
          grupoABO: "A",
          factorRhD: "POSITIVO",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          cantidad: 2,
          estado: "APROBADA",
          operador: "Seeder",
          observaciones: "Cirugía programada",
        },
        {
          dniPaciente: "28444555",
          nombrePaciente: "Marcos Gómez",
          grupoABO: "O",
          factorRhD: "NEGATIVO",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          cantidad: 1,
          estado: "APROBADA",
          operador: "Seeder",
          observaciones: "Anemia crónica",
        },
        {
          dniPaciente: "35999888",
          nombrePaciente: "Ana Sosa",
          grupoABO: "B",
          factorRhD: "POSITIVO",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          cantidad: 1,
          estado: "PENDIENTE",
          operador: "Seeder",
          observaciones: "Pendiente de aprobación",
        },
      ],
    });
  }

  const unidades = [
    { numeroUnidad: "U-1001", grupoABO: "A", factorRhD: "POSITIVO", dias: 30, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1002", grupoABO: "O", factorRhD: "POSITIVO", dias: 25, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1003", grupoABO: "O", factorRhD: "NEGATIVO", dias: 20, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1004", grupoABO: "B", factorRhD: "POSITIVO", dias: 15, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1005", grupoABO: "AB", factorRhD: "NEGATIVO", dias: 10, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1006", grupoABO: "O", factorRhD: "NEGATIVO", dias: -5, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1007", grupoABO: "A", factorRhD: "POSITIVO", dias: 40, estado: "BLOQUEADA" as const },
    { numeroUnidad: "U-1008", grupoABO: "O", factorRhD: "POSITIVO", dias: 30, estado: "DISPONIBLE" as const, tipoHemocomponente: "PLASMA" as const },
  ];

  for (const unidad of unidades) {
    await prisma.unidadSangre.upsert({
      where: { numeroUnidad: unidad.numeroUnidad },
      update: {},
      create: {
        numeroUnidad: unidad.numeroUnidad,
        tipoHemocomponente: unidad.tipoHemocomponente ?? "GLOBULOS_ROJOS",
        grupoABO: unidad.grupoABO as any,
        factorRhD: unidad.factorRhD as any,
        fechaVencimiento: enDias(unidad.dias),
        estado: unidad.estado as any,
        operador: "Seeder",
      },
    });
  }

  console.log("22-solicitudes-y-unidades: solicitudes y unidades demo");
}
