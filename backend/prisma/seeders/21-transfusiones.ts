import type { PrismaClient } from "../../generated/prisma/client";

export async function seed21Transfusiones(prisma: PrismaClient) {
  await prisma.transfusion.upsert({
    where: { id: 1 },
    update: {
      numeroOLote: "L-2026-0001",
      rt: "No",
      tolerancia: "Buena",
      pci: "Compatible",
      pcd: "Negativo",
      anticuerpo: "Ninguno",
      idFenotipo1: 1,
      idGrupoFactor: 1,
      idFenotipo2: 3,
      idTipoTransfusion: 1,
    },
    create: {
      id: 1,
      numeroOLote: "L-2026-0001",
      rt: "No",
      tolerancia: "Buena",
      pci: "Compatible",
      pcd: "Negativo",
      anticuerpo: "Ninguno",
      idFenotipo1: 1,
      idGrupoFactor: 1,
      idFenotipo2: 3,
      idTipoTransfusion: 1,
    },
  });

  console.log("21-transfusiones: 1 registro demo");
}
