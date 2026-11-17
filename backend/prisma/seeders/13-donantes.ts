import type { PrismaClient } from "../../generated/prisma/client";

export async function seed13Donantes(prisma: PrismaClient) {
  const data = [
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Ramírez",
      dni: "27123456",
      fechaNacimiento: new Date("1988-03-12"),
      lugarNacimiento: "Resistencia",
      sexoBiologico: "MASCULINO" as const,
      domicilio: "Av. 9 de Julio 123",
      codigoPostal: "3500",
      email: "carlos.ramirez@example.com",
      telefonoFijo: null,
      telefonoCelular: "3624000001",
    },
    {
      id: 2,
      nombre: "Sofía",
      apellido: "Benítez",
      dni: "31222333",
      fechaNacimiento: new Date("1992-11-30"),
      lugarNacimiento: "Barranqueras",
      sexoBiologico: "FEMENINO" as const,
      domicilio: "Calle Güemes 456 2B",
      codigoPostal: "3500",
      email: "sofia.benitez@example.com",
      telefonoFijo: "3624444444",
      telefonoCelular: "3624000002",
    },
  ];

  for (const donante of data) {
    await prisma.donante.upsert({
      where: { id: donante.id },
      update: { ...donante },
      create: donante,
    });
  }

  console.log(`13-donantes: ${data.length} registros`);
}
