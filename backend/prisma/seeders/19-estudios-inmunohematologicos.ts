import type { PrismaClient } from "../../generated/prisma/client";

export async function seed19EstudiosInmunohematologicos(prisma: PrismaClient) {
  await prisma.estudioInmunohematologicoGestante.upsert({
    where: { id: 1 },
    update: { numero: "GEST-001", fecha: new Date("2026-10-04"), idPersona: 3 },
    create: { id: 1, numero: "GEST-001", fecha: new Date("2026-10-04"), idPersona: 3 },
  });

  const vinculo = await prisma.pciInmunohematologicoGestante.findFirst({
    where: { idPci: 1, idEstudiosInmunohematologicosGestante: 1 },
  });
  if (!vinculo) {
    await prisma.pciInmunohematologicoGestante.create({
      data: { idPci: 1, idEstudiosInmunohematologicosGestante: 1 },
    });
  }

  await prisma.estudioInmunohematologicoRn.upsert({
    where: { id: 1 },
    update: {
      numero: "RN-001",
      fecha: new Date("2026-10-05"),
      rn: "RN de Ana Sosa",
      dni: "60000001",
      idMadre: 3,
      idGrupoFactor: 1,
      ipAntiD: "No aplica",
      idPcd: 1,
      idPci: 1,
      observaciones: "Estudio RN demo",
    },
    create: {
      id: 1,
      numero: "RN-001",
      fecha: new Date("2026-10-05"),
      rn: "RN de Ana Sosa",
      dni: "60000001",
      idMadre: 3,
      idGrupoFactor: 1,
      ipAntiD: "No aplica",
      idPcd: 1,
      idPci: 1,
      observaciones: "Estudio RN demo",
    },
  });

  console.log("19-estudios-inmunohematologicos: gestante y RN demo");
}
