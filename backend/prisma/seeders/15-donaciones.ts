import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  ESTADOS_DONACION,
  booleano,
  entero,
  fechaReciente,
  hemoglobinaNumero,
  hemoglobinaTexto,
  observacion,
  operador,
  peso,
  pick,
  resetFake,
  tensionArterial,
} from "./_fake";

type DonacionAppSeed = {
  id: number;
  donanteId: number;
  fechaHora: Date;
  operador: string;
  estado: (typeof ESTADOS_DONACION)[number];
  peso: string;
  tensionArterial: string;
  hemoglobina: string;
  voluntario: boolean;
  reposicion: boolean;
  autoExcluido: boolean;
  observaciones: string | null;
};

type DonacionDerSeed = {
  id: number;
  peso: number;
  tensionArterial: string;
  hemoglobina: number;
  fecha: Date;
  voluntario: boolean;
  reposicion: boolean;
  autoexcluido: boolean;
  observaciones: string | null;
  idPersona: number;
};

export async function seed15Donaciones(prisma: PrismaClient) {
  resetFake(115);

  // Donaciones de la app (asociadas a Donante). El ID 1 se conserva porque
  // 16-pci y 17-serologias lo vinculan.
  const donacionesApp: DonacionAppSeed[] = [
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

  for (let id = donacionesApp.length + 1; id <= CANTIDAD; id++) {
    donacionesApp.push({
      id,
      donanteId: entero(1, CANTIDAD),
      fechaHora: fechaReciente(),
      operador: operador(),
      estado: pick(ESTADOS_DONACION),
      peso: String(peso()),
      tensionArterial: tensionArterial(),
      hemoglobina: hemoglobinaTexto(),
      voluntario: booleano(0.65),
      reposicion: booleano(0.3),
      autoExcluido: booleano(0.05),
      observaciones: observacion(),
    });
  }

  for (const donacion of donacionesApp) {
    await prisma.donacion.upsert({
      where: { id: donacion.id },
      update: { ...donacion },
      create: donacion,
    });
  }

  // Donaciones según DER (asociadas a Persona). El ID 1 también se conserva.
  const donacionesDer: DonacionDerSeed[] = [
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

  for (let id = donacionesDer.length + 1; id <= CANTIDAD; id++) {
    donacionesDer.push({
      id,
      peso: peso(),
      tensionArterial: tensionArterial(),
      hemoglobina: hemoglobinaNumero(),
      fecha: fechaReciente(),
      voluntario: booleano(0.65),
      reposicion: booleano(0.3),
      autoexcluido: booleano(0.05),
      observaciones: observacion(),
      idPersona: entero(1, CANTIDAD),
    });
  }

  for (const donacion of donacionesDer) {
    await prisma.donacionDer.upsert({
      where: { id: donacion.id },
      update: { ...donacion },
      create: donacion,
    });
  }

  console.log(`15-donaciones: ${donacionesApp.length} app, ${donacionesDer.length} DER`);
}
