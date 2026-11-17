import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  diagnostico,
  entero,
  fechaReciente,
  operador,
  pick,
  reposicion,
  resetFake,
} from "./_fake";

type SangriaSeed = {
  id: number;
  diagnostico: string | null;
  extraccion: string | null;
  reposicion: string | null;
  fecha: Date | null;
  tecnico: string | null;
  idPersona: number | null;
  idObraSocial: number | null;
  idMedico: number | null;
};

export async function seed20SangriasTerapeuticas(prisma: PrismaClient) {
  resetFake(120);

  // El ID 1 se conserva: es el registro de referencia de la pantalla de sangrías.
  const data: SangriaSeed[] = [
    {
      id: 1,
      diagnostico: "Hemocromatosis",
      extraccion: "450 ml",
      reposicion: "Suero fisiológico",
      fecha: new Date("2026-10-06"),
      tecnico: "Seeder",
      idPersona: 2,
      idObraSocial: 1,
      idMedico: 1,
    },
  ];

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    data.push({
      id,
      diagnostico: diagnostico(),
      extraccion: pick(["350 ml", "450 ml", "500 ml"]),
      reposicion: reposicion(),
      fecha: fechaReciente(),
      tecnico: operador(),
      idPersona: entero(1, CANTIDAD),
      idObraSocial: entero(1, 3),
      idMedico: entero(1, 2),
    });
  }

  for (const sangria of data) {
    await prisma.sangriaTerapeutica.upsert({
      where: { id: sangria.id },
      update: { ...sangria },
      create: sangria,
    });
  }

  console.log(`20-sangrias-terapeuticas: ${data.length} registros`);
}
