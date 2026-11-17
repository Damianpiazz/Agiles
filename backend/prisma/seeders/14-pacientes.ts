import type { PrismaClient } from "../../generated/prisma/client";
import { CANTIDAD, apellido, dni, fechaNacimiento, nombre, operador, resetFake } from "./_fake";

type PacienteSeed = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  operador: string;
};

export async function seed14Pacientes(prisma: PrismaClient) {
  resetFake(114);

  // Los IDs 1-2 se conservan: 22-solicitudes usa sus DNIs en los datos base.
  const data: PacienteSeed[] = [
    {
      id: 1,
      nombre: "Lucía",
      apellido: "Fernández",
      dni: "30111222",
      fechaNacimiento: new Date("1990-05-10"),
      operador: "Seeder",
    },
    {
      id: 2,
      nombre: "Marcos",
      apellido: "Gómez",
      dni: "28444555",
      fechaNacimiento: new Date("1985-08-20"),
      operador: "Seeder",
    },
  ];

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    data.push({
      id,
      nombre: nombre(),
      apellido: apellido(),
      dni: dni(),
      fechaNacimiento: fechaNacimiento(),
      operador: operador(),
    });
  }

  for (const paciente of data) {
    await prisma.paciente.upsert({
      where: { id: paciente.id },
      update: { ...paciente },
      create: paciente,
    });
  }

  console.log(`14-pacientes: ${data.length} registros`);
}
