-- CreateEnum
CREATE TYPE "EstadoUnidad" AS ENUM ('PENDIENTE', 'LIBERADA', 'BLOQUEADA');

-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "discrepanciaResuelta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estadoUnidad" "EstadoUnidad" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "observacionDiscrepancia" TEXT;

-- CreateTable
CREATE TABLE "eventos_estado_unidad" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "estado" "EstadoUnidad" NOT NULL,
    "motivo" TEXT,
    "usuario" TEXT NOT NULL,
    "discrepanciaResuelta" BOOLEAN NOT NULL DEFAULT false,
    "observacionDiscrepancia" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_estado_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_estado_unidad_donacionId_fechaHora_idx" ON "eventos_estado_unidad"("donacionId", "fechaHora");

-- AddForeignKey
ALTER TABLE "eventos_estado_unidad" ADD CONSTRAINT "eventos_estado_unidad_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
