import type { PrismaClient } from "../../generated/prisma/client";

export async function seed15Donaciones(prisma: PrismaClient) {
  // Donaciones de la app (asociadas a Donante)
  const donacionesApp = [
    {
      id: 1,
      donanteId: 1,
      fechaHora: new Date("2026-10-01T09:00:00-03:00"),
      operador: "Seeder",
      estado: "REGISTRADA" as const,
      peso: "75",
      tensionArterial: "120/80",
      hemoglobina: "14.5",
      voluntario: true,
      reposicion: false,
      autoExcluido: false,
      observaciones: "Donación inicial demo",
    },
  ];

  for (const donacion of donacionesApp) {
    await prisma.donacion.upsert({
      where: { id: donacion.id },
      update: { ...donacion },
      create: donacion,
    });
  }

  // Donaciones según DER (asociadas a Persona)
  const donacionesDer = [
    {
      id: 1,
      peso: 75.0,
      tensionArterial: "120/80",
      hemoglobina: 14.5,
      fecha: new Date("2026-10-01"),
      voluntario: true,
      reposicion: false,
      autoexcluido: false,
      observaciones: "Donación DER demo",
      idPersona: 1,
    },
  ];

  for (const donacion of donacionesDer) {
    await prisma.donacionDer.upsert({
      where: { id: donacion.id },
      update: { ...donacion },
      create: donacion,
    });
  }

  console.log(`15-donaciones: ${donacionesApp.length} app, ${donacionesDer.length} DER`);
}
