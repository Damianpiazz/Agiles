import type { PrismaClient } from "../../generated/prisma/client";
import { CANTIDAD, calle, entero, numeroCalle, pick, resetFake } from "./_fake";

type DomicilioSeed = {
  id: number;
  calle: string | null;
  numero: string | null;
  piso: string | null;
  departamento: string | null;
  idCiudad: number;
};

export async function seed03Domicilios(prisma: PrismaClient) {
  resetFake(103);

  // Los IDs 1-3 se conservan: 12-personas los referencia como idDirección.
  const data: DomicilioSeed[] = [
    { id: 1, calle: "Av. 9 de Julio", numero: "123", piso: null, departamento: null, idCiudad: 1 },
    { id: 2, calle: "Calle Güemes", numero: "456", piso: "2", departamento: "B", idCiudad: 1 },
    { id: 3, calle: "San Martín", numero: "789", piso: null, departamento: null, idCiudad: 3 },
  ];

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    data.push({
      id,
      calle: calle(),
      numero: numeroCalle(),
      piso: entero(0, 1) ? String(entero(1, 12)) : null,
      departamento: entero(0, 1) ? pick(["A", "B", "C", "D"]) : null,
      idCiudad: entero(1, 3),
    });
  }

  for (const domicilio of data) {
    await prisma.domicilio.upsert({
      where: { id: domicilio.id },
      update: {
        calle: domicilio.calle,
        numero: domicilio.numero,
        piso: domicilio.piso,
        departamento: domicilio.departamento,
        idCiudad: domicilio.idCiudad,
      },
      create: domicilio,
    });
  }

  console.log(`03-domicilios: ${data.length} registros`);
}
