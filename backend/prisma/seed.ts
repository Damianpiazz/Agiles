import { prisma } from "../src/config/prisma";

import { seed01Provincias } from "./seeders/01-provincias";
import { seed02Ciudades } from "./seeders/02-ciudades";
import { seed03Domicilios } from "./seeders/03-domicilios";
import { seed04Gyf } from "./seeders/04-gyf";
import { seed05Antigenos } from "./seeders/05-antigenos";
import { seed06DeterminacionesSerologicas } from "./seeders/06-determinaciones-serologicas";
import { seed07DeterminacionesPcd } from "./seeders/07-determinaciones-pcd";
import { seed08ObrasSociales } from "./seeders/08-obras-sociales";
import { seed09Medicos } from "./seeders/09-medicos";
import { seed10Fenotipos } from "./seeders/10-fenotipos";
import { seed11TiposTransfusion } from "./seeders/11-tipos-transfusion";
import { seed12Personas } from "./seeders/12-personas";
import { seed13Donantes } from "./seeders/13-donantes";
import { seed14Pacientes } from "./seeders/14-pacientes";
import { seed15Donaciones } from "./seeders/15-donaciones";
import { seed16Pci } from "./seeders/16-pci";
import { seed17Serologias } from "./seeders/17-serologias";
import { seed18Pcd } from "./seeders/18-pcd";
import { seed19EstudiosInmunohematologicos } from "./seeders/19-estudios-inmunohematologicos";
import { seed20SangriasTerapeuticas } from "./seeders/20-sangrias-terapeuticas";
import { seed21Transfusiones } from "./seeders/21-transfusiones";
import { seed22SolicitudesYUnidades } from "./seeders/22-solicitudes-y-unidades";
import { seed23Usuarios } from "./seeders/23-usuarios";

async function main() {
  await seed01Provincias(prisma);
  await seed02Ciudades(prisma);
  await seed03Domicilios(prisma);
  await seed04Gyf(prisma);
  await seed05Antigenos(prisma);
  await seed06DeterminacionesSerologicas(prisma);
  await seed07DeterminacionesPcd(prisma);
  await seed08ObrasSociales(prisma);
  await seed09Medicos(prisma);
  await seed10Fenotipos(prisma);
  await seed11TiposTransfusion(prisma);
  await seed12Personas(prisma);
  await seed13Donantes(prisma);
  await seed14Pacientes(prisma);
  await seed15Donaciones(prisma);
  await seed16Pci(prisma);
  await seed17Serologias(prisma);
  await seed18Pcd(prisma);
  await seed19EstudiosInmunohematologicos(prisma);
  await seed20SangriasTerapeuticas(prisma);
  await seed21Transfusiones(prisma);
  await seed22SolicitudesYUnidades(prisma);
  await seed23Usuarios(prisma);

  console.log("Seed OK: seeders 01-23 ejecutados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
