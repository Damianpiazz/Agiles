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
  "HBsAg",
  "Anti-HBc",
  "Anti-HCV",
  "Anti-HIV",
  "VDRL (sífilis)",
  "Chagas",
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

  console.log(
    `Seed OK: ${antigenos.length} antígenos y ${determinacionesSerologicas.length} determinaciones serológicas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
