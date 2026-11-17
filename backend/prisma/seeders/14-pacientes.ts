import type { PrismaClient } from "../../generated/prisma/client";

export async function seed14Pacientes(prisma: PrismaClient) {
  const data = [
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

  for (const paciente of data) {
    await prisma.paciente.upsert({
      where: { id: paciente.id },
      update: { ...paciente },
      create: paciente,
    });
  }

  console.log(`14-pacientes: ${data.length} registros`);
}
