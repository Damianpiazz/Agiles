import type { PrismaClient } from "../../generated/prisma/client";

export async function seed12Personas(prisma: PrismaClient) {
  const data = [
    {
      id: 1,
      dni: "30111222",
      nombre: "Lucía",
      apellido: "Fernández",
      fechaNacimiento: new Date("1990-05-10"),
      lugarNacimiento: "Resistencia",
      idDireccion: 1,
      idGrupoFactor: 1,
    },
    {
      id: 2,
      dni: "28444555",
      nombre: "Marcos",
      apellido: "Gómez",
      fechaNacimiento: new Date("1985-08-20"),
      lugarNacimiento: "Corrientes",
      idDireccion: 3,
      idGrupoFactor: 8,
    },
    {
      id: 3,
      dni: "35999888",
      nombre: "Ana",
      apellido: "Sosa",
      fechaNacimiento: new Date("1995-02-14"),
      lugarNacimiento: "Resistencia",
      idDireccion: 2,
      idGrupoFactor: 3,
    },
  ];

  for (const persona of data) {
    await prisma.persona.upsert({
      where: { id: persona.id },
      update: {
        dni: persona.dni,
        nombre: persona.nombre,
        apellido: persona.apellido,
        fechaNacimiento: persona.fechaNacimiento,
        lugarNacimiento: persona.lugarNacimiento,
        idDireccion: persona.idDireccion,
        idGrupoFactor: persona.idGrupoFactor,
      },
      create: persona,
    });
  }

  console.log(`12-personas: ${data.length} registros`);
}
