import type { PrismaClient } from "../../generated/prisma/client";
import { CANTIDAD, booleano, fechaReciente, hora, muestra, observacion, operador, pick, resetFake } from "./_fake";

export async function seed16Pci(prisma: PrismaClient) {
  resetFake(116);

  const antigenos = await prisma.antigeno.findMany({ select: { id: true, nombre: true } });
  const antigenoD = antigenos.find((antigeno) => antigeno.nombre === "D");

  for (let id = 1; id <= CANTIDAD; id++) {
    const pci = {
      id,
      fecha: id === 1 ? new Date("2026-10-02") : fechaReciente(),
      hora: id === 1 ? new Date("1970-01-01T10:30:00Z") : hora(),
      operador: id === 1 ? null : operador(),
      observaciones: id === 1 ? "PCI demo" : observacion(),
    };

    await prisma.pci.upsert({
      where: { id },
      update: { ...pci },
      create: pci,
    });

    // Vínculo app: PCI <-> Donacion (el donacionId coincide con el ID del PCI).
    await prisma.pciDonacion.upsert({
      where: { pciId_donacionId: { pciId: id, donacionId: id } },
      update: {},
      create: { pciId: id, donacionId: id },
    });

    // Vínculo DER: PCI <-> DonacionDer.
    const existenteDer = await prisma.pciDonacionDer.findFirst({ where: { idPci: id, idDonacion: id } });
    if (!existenteDer) {
      await prisma.pciDonacionDer.create({ data: { idPci: id, idDonacion: id } });
    }

    const elegidos = id === 1 && antigenoD ? [antigenoD] : muestra(antigenos, 1, 3);
    for (const antigeno of elegidos) {
      const resultado = id === 1 ? "NEGATIVO" : booleano(0.2) ? "POSITIVO" : "NEGATIVO";
      const intensidad = resultado === "POSITIVO" ? pick(["+", "++", "+++"]) : null;
      const detalle = {
        resultado,
        intensidad,
        observacion: id === 1 ? "Seed demo" : observacion(),
      };

      await prisma.pciResultado.upsert({
        where: { pciId_antigenoId: { pciId: id, antigenoId: antigeno.id } },
        update: detalle,
        create: { pciId: id, antigenoId: antigeno.id, ...detalle },
      });
    }
  }

  console.log(`16-pci: ${CANTIDAD} PCIs, vínculos y resultados`);
}
