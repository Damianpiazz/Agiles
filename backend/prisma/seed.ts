import { prisma } from "../src/config/prisma";

/**
 * Catálogo de antígenos para la Prueba de Coombs Indirecta (PCI).
 * Panel extendido de antígenos eritrocitarios de uso frecuente.
 */
const antigenos = [
  "D",
  "C",
  "c",
  "E",
  "e",
  "K",
  "k",
  "Fy(a)",
  "Fy(b)",
  "Jk(a)",
  "Jk(b)",
  "M",
  "N",
  "S",
  "s",
  "Le(a)",
  "Le(b)",
  "P1",
];

/**
 * Catálogo de determinaciones serológicas (cribado de enfermedades transmisibles).
 */
const determinacionesSerologicas = [
  "Anti-T. cruzi",
  "HBsAg",
  "Anti-core HB",
  "Anti-HCV",
  "Anti-VIH 1/2",
  "Anti-Treponema pallidum",
  "Anti-HTLV I/II",
];

async function main() {
  for (const nombre of antigenos) {
    await prisma.antigeno.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  for (const nombre of determinacionesSerologicas) {
    await prisma.determinacionSerologica.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  await seedSolicitudesYUnidades();

  console.log(
    `Seed OK: ${antigenos.length} antígenos y ${determinacionesSerologicas.length} determinaciones serológicas.`,
  );
}

function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + cantidad);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/**
 * Datos de demostración para HU-017 (selección/preparación de componentes):
 * solicitudes de transfusión aprobadas y unidades de sangre en inventario.
 */
async function seedSolicitudesYUnidades() {
  const solicitudesExistentes = await prisma.solicitudTransfusion.count();

  if (solicitudesExistentes === 0) {
    await prisma.solicitudTransfusion.createMany({
      data: [
        {
          dniPaciente: "30111222",
          nombrePaciente: "Lucía Fernández",
          grupoABO: "A",
          factorRhD: "POSITIVO",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          cantidad: 2,
          estado: "APROBADA",
          operador: "Damián Piazza",
          observaciones: "Cirugía programada",
        },
        {
          dniPaciente: "28444555",
          nombrePaciente: "Marcos Gómez",
          grupoABO: "O",
          factorRhD: "NEGATIVO",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          cantidad: 1,
          estado: "APROBADA",
          operador: "Damián Piazza",
          observaciones: "Anemia crónica",
        },
        {
          dniPaciente: "35999888",
          nombrePaciente: "Ana Sosa",
          grupoABO: "B",
          factorRhD: "POSITIVO",
          tipoHemocomponente: "GLOBULOS_ROJOS",
          cantidad: 1,
          estado: "PENDIENTE",
          operador: "Damián Piazza",
          observaciones: "Pendiente de aprobación",
        },
      ],
    });
  }

  const unidades = [
    { numeroUnidad: "U-1001", grupoABO: "A", factorRhD: "POSITIVO", dias: 30, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1002", grupoABO: "O", factorRhD: "POSITIVO", dias: 25, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1003", grupoABO: "O", factorRhD: "NEGATIVO", dias: 20, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1004", grupoABO: "B", factorRhD: "POSITIVO", dias: 15, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1005", grupoABO: "AB", factorRhD: "NEGATIVO", dias: 10, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1006", grupoABO: "O", factorRhD: "NEGATIVO", dias: -5, estado: "DISPONIBLE" as const },
    { numeroUnidad: "U-1007", grupoABO: "A", factorRhD: "POSITIVO", dias: 40, estado: "BLOQUEADA" as const },
    { numeroUnidad: "U-1008", grupoABO: "O", factorRhD: "POSITIVO", dias: 30, estado: "DISPONIBLE" as const, tipoHemocomponente: "PLASMA" as const },
  ];

  for (const unidad of unidades) {
    await prisma.unidadSangre.upsert({
      where: { numeroUnidad: unidad.numeroUnidad },
      update: {},
      create: {
        numeroUnidad: unidad.numeroUnidad,
        tipoHemocomponente: unidad.tipoHemocomponente ?? "GLOBULOS_ROJOS",
        grupoABO: unidad.grupoABO,
        factorRhD: unidad.factorRhD,
        fechaVencimiento: enDias(unidad.dias),
        estado: unidad.estado,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
