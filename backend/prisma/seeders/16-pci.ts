import type { PrismaClient } from "../../generated/prisma/client";

export async function seed16Pci(prisma: PrismaClient) {
  const fecha = new Date("2026-10-02");
  const hora = new Date("1970-01-01T10:30:00Z");

  await prisma.pci.upsert({
    where: { id: 1 },
    update: { fecha, hora, observaciones: "PCI demo" },
    create: { id: 1, fecha, hora, observaciones: "PCI demo" },
  });

  // Vínculo app: PCI <-> Donacion
  await prisma.pciDonacion.upsert({
    where: { pciId_donacionId: { pciId: 1, donacionId: 1 } },
    update: {},
    create: { pciId: 1, donacionId: 1 },
  });

  // Vínculo DER: PCI <-> DonacionDer
  const existenteDer = await prisma.pciDonacionDer.findFirst({ where: { idPci: 1, idDonacion: 1 } });
  if (!existenteDer) {
    await prisma.pciDonacionDer.create({ data: { idPci: 1, idDonacion: 1 } });
  }

  // Resultado PCI (app/DER comparten tabla pci_resultados)
  const antigenoD = await prisma.antigeno.findUnique({ where: { nombre: "D" } });
  if (antigenoD) {
    await prisma.pciResultado.upsert({
      where: { pciId_antigenoId: { pciId: 1, antigenoId: antigenoD.id } },
      update: { resultado: "NEGATIVO", intensidad: null, observacion: "Seed demo" },
      create: { pciId: 1, antigenoId: antigenoD.id, resultado: "NEGATIVO", observacion: "Seed demo" },
    });
  }

  console.log("16-pci: 1 PCI, vínculos y resultados demo");
}
