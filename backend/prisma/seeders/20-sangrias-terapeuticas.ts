import type { PrismaClient } from "../../generated/prisma/client";

export async function seed20SangriasTerapeuticas(prisma: PrismaClient) {
  await prisma.sangriaTerapeutica.upsert({
    where: { id: 1 },
    update: {
      diagnostico: "Hemocromatosis",
      extraccion: "450 ml",
      reposicion: "Suero fisiológico",
      idPersona: 2,
      idObraSocial: 1,
      idMedico: 1,
    },
    create: {
      id: 1,
      diagnostico: "Hemocromatosis",
      extraccion: "450 ml",
      reposicion: "Suero fisiológico",
      idPersona: 2,
      idObraSocial: 1,
      idMedico: 1,
    },
  });

  console.log("20-sangrias-terapeuticas: 1 registro demo");
}
