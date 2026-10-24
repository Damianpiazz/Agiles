-- CreateEnum
CREATE TYPE "GrupoSanguineoABO" AS ENUM ('A', 'B', 'AB', 'O');

-- CreateEnum
CREATE TYPE "FactorRhD" AS ENUM ('POSITIVO', 'NEGATIVO');

-- CreateTable
CREATE TABLE "tipificaciones_sanguineas" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "grupoABO" "GrupoSanguineoABO" NOT NULL,
    "factorRhD" "FactorRhD" NOT NULL,
    "operador" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipificaciones_sanguineas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tipificaciones_sanguineas_donacionId_fechaHora_idx" ON "tipificaciones_sanguineas"("donacionId", "fechaHora");

-- AddForeignKey
ALTER TABLE "tipificaciones_sanguineas" ADD CONSTRAINT "tipificaciones_sanguineas_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
