import type { PrismaClient } from "../../generated/prisma/client";
import {
  CANTIDAD,
  apellido,
  dni,
  entero,
  fechaNacimiento,
  historiaClinica,
  localidad,
  nombre,
  resetFake,
  sexo,
  SEXOS,
  telefono,
} from "./_fake";

type PersonaSeed = {
  id: number;
  dni: string;
  historiaClinica?: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  fechaNacimiento: Date;
  lugarNacimiento: string;
  sexoBiologico?: (typeof SEXOS)[number];
  idDireccion: number;
  idGrupoFactor: number;
};

export async function seed12Personas(prisma: PrismaClient) {
  resetFake(112);

  // Los IDs 1-3 se conservan: otros seeders los referencian por idPersona/idMadre.
  const data: PersonaSeed[] = [
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

  for (let id = data.length + 1; id <= CANTIDAD; id++) {
    data.push({
      id,
      dni: dni(),
      historiaClinica: historiaClinica(),
      nombre: nombre(),
      apellido: apellido(),
      telefono: telefono(),
      fechaNacimiento: fechaNacimiento(),
      lugarNacimiento: localidad(),
      sexoBiologico: sexo(),
      idDireccion: entero(1, CANTIDAD),
      idGrupoFactor: entero(1, 8),
    });
  }

  for (const persona of data) {
    await prisma.persona.upsert({
      where: { id: persona.id },
      update: { ...persona },
      create: persona,
    });
  }

  console.log(`12-personas: ${data.length} registros`);
}
