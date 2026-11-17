import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  apellido,
  booleano,
  calle,
  codigoPostal,
  dni,
  email,
  fechaNacimiento,
  localidad,
  nombre,
  numeroCalle,
  resetFake,
  sexo,
  SEXOS,
  telefono,
} from "./_fake";

type DonanteSeed = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  lugarNacimiento: string;
  sexoBiologico: (typeof SEXOS)[number];
  domicilio: string;
  codigoPostal: string;
  email: string;
  telefonoFijo: string | null;
  telefonoCelular: string;
};

export async function seed13Donantes(prisma: PrismaClient) {
  resetFake(113);

  // Los IDs 1-2 se conservan: 15-donaciones referencia donanteId 1.
  const data: DonanteSeed[] = [
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Ramírez",
      dni: "27123456",
      fechaNacimiento: new Date("1988-03-12"),
      lugarNacimiento: "Resistencia",
      sexoBiologico: "MASCULINO",
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
      sexoBiologico: "FEMENINO",
      domicilio: "Calle Güemes 456 2B",
      codigoPostal: "3500",
      email: "sofia.benitez@example.com",
      telefonoFijo: "3624444444",
      telefonoCelular: "3624000002",
    },
  ];

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    const nombreGenerado = nombre();
    const apellidoGenerado = apellido();
    data.push({
      id,
      nombre: nombreGenerado,
      apellido: apellidoGenerado,
      dni: dni(),
      fechaNacimiento: fechaNacimiento(),
      lugarNacimiento: localidad(),
      sexoBiologico: sexo(),
      domicilio: `${calle()} ${numeroCalle()}`,
      codigoPostal: codigoPostal(),
      email: email(nombreGenerado, apellidoGenerado),
      telefonoFijo: booleano(0.35) ? telefono() : null,
      telefonoCelular: telefono(),
    });
  }

  for (const donante of data) {
    await prisma.donante.upsert({
      where: { id: donante.id },
      update: { ...donante },
      create: donante,
    });
  }

  console.log(`13-donantes: ${data.length} registros`);
}
