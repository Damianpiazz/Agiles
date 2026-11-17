import type { PrismaClient } from "../../generated/prisma/client";

export async function seed03Domicilios(prisma: PrismaClient) {
  const data = [
    { id: 1, calle: "Av. 9 de Julio", numero: "123", piso: null, departamento: null, idCiudad: 1 },
    { id: 2, calle: "Calle Güemes", numero: "456", piso: "2", departamento: "B", idCiudad: 1 },
    { id: 3, calle: "San Martín", numero: "789", piso: null, departamento: null, idCiudad: 3 },
  ];

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
