-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "autoExcluido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hemoglobina" TEXT,
ADD COLUMN     "peso" TEXT,
ADD COLUMN     "reposicion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tensionArterial" TEXT,
ADD COLUMN     "voluntario" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "antigenos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "antigenos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "determinaciones_serologicas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "determinaciones_serologicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pci" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pci_resultados" (
    "id" SERIAL NOT NULL,
    "pciId" INTEGER NOT NULL,
    "antigenoId" INTEGER NOT NULL,
    "resultado" TEXT NOT NULL,
    "intensidad" TEXT,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pci_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pci_donaciones" (
    "pciId" INTEGER NOT NULL,
    "donacionId" INTEGER NOT NULL,

    CONSTRAINT "pci_donaciones_pkey" PRIMARY KEY ("pciId","donacionId")
);

-- CreateTable
CREATE TABLE "serologias" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serologias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serologia_resultados" (
    "id" SERIAL NOT NULL,
    "serologiaId" INTEGER NOT NULL,
    "determinacionSerologicaId" INTEGER NOT NULL,
    "resultado" TEXT NOT NULL,
    "valor" TEXT,
    "unidad" TEXT,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serologia_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serologia_donaciones" (
    "serologiaId" INTEGER NOT NULL,
    "donacionId" INTEGER NOT NULL,

    CONSTRAINT "serologia_donaciones_pkey" PRIMARY KEY ("serologiaId","donacionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "antigenos_nombre_key" ON "antigenos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "determinaciones_serologicas_nombre_key" ON "determinaciones_serologicas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pci_resultados_pciId_antigenoId_key" ON "pci_resultados"("pciId", "antigenoId");

-- CreateIndex
CREATE UNIQUE INDEX "serologia_resultados_serologiaId_determinacionSerologicaId_key" ON "serologia_resultados"("serologiaId", "determinacionSerologicaId");

-- AddForeignKey
ALTER TABLE "pci_resultados" ADD CONSTRAINT "pci_resultados_pciId_fkey" FOREIGN KEY ("pciId") REFERENCES "pci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_resultados" ADD CONSTRAINT "pci_resultados_antigenoId_fkey" FOREIGN KEY ("antigenoId") REFERENCES "antigenos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_donaciones" ADD CONSTRAINT "pci_donaciones_pciId_fkey" FOREIGN KEY ("pciId") REFERENCES "pci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_donaciones" ADD CONSTRAINT "pci_donaciones_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serologia_resultados" ADD CONSTRAINT "serologia_resultados_serologiaId_fkey" FOREIGN KEY ("serologiaId") REFERENCES "serologias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serologia_resultados" ADD CONSTRAINT "serologia_resultados_determinacionSerologicaId_fkey" FOREIGN KEY ("determinacionSerologicaId") REFERENCES "determinaciones_serologicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serologia_donaciones" ADD CONSTRAINT "serologia_donaciones_serologiaId_fkey" FOREIGN KEY ("serologiaId") REFERENCES "serologias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serologia_donaciones" ADD CONSTRAINT "serologia_donaciones_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
