import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  entero,
  fechaReciente,
  numeroLote,
  operador,
  pick,
  resetFake,
  tolerancia,
} from "./_fake";

type TransfusionSeed = {
  id: number;
  numeroOLote: string | null;
  rt: string | null;
  tolerancia: string | null;
  pci: string | null;
  pcd: string | null;
  anticuerpo: string | null;
  fecha: Date | null;
  tecnico: string | null;
  idPersona: number | null;
  idFenotipo1: number | null;
  idGrupoFactor: number | null;
  idFenotipo2: number | null;
  idTipoTransfusion: number | null;
};

export async function seed21Transfusiones(prisma: PrismaClient) {
  resetFake(121);

  // El ID 1 se conserva: es el registro de referencia de la pantalla de transfusiones.
  const data: TransfusionSeed[] = [
    {
      id: 1,
      numeroOLote: "L-2026-0001",
      rt: "No",
      tolerancia: "Buena",
      pci: "Compatible",
      pcd: "Negativo",
      anticuerpo: "Ninguno",
      fecha: new Date("2026-10-07"),
      tecnico: "Seeder",
      idPersona: 1,
      idFenotipo1: 1,
      idGrupoFactor: 1,
      idFenotipo2: 3,
      idTipoTransfusion: 1,
    },
  ];

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    data.push({
      id,
      numeroOLote: numeroLote(),
      rt: pick(["Si", "No", "N/A"]),
      tolerancia: tolerancia(),
      pci: pick(["Compatible", "Incompatible", "Pendiente"]),
      pcd: pick(["Negativo", "Positivo"]),
      anticuerpo: pick(["Ninguno", "Anti-D", "Anti-K", "Anti-c"]),
      fecha: fechaReciente(),
      tecnico: operador(),
      idPersona: entero(1, CANTIDAD),
      idFenotipo1: entero(1, 3),
      idGrupoFactor: entero(1, 8),
      idFenotipo2: entero(1, 3),
      idTipoTransfusion: entero(1, 3),
    });
  }

  for (const transfusion of data) {
    await prisma.transfusion.upsert({
      where: { id: transfusion.id },
      update: { ...transfusion },
      create: transfusion,
    });
  }

  console.log(`21-transfusiones: ${data.length} registros`);
}
