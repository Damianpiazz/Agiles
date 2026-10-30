-- CreateEnum
CREATE TYPE "TipoHemocomponente" AS ENUM ('GLOBULOS_ROJOS', 'PLASMA', 'PLAQUETAS', 'CRIOPRECIPITADO');

-- CreateEnum
CREATE TYPE "EstadoSolicitudTransfusion" AS ENUM ('PENDIENTE', 'APROBADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoUnidadSangre" AS ENUM ('DISPONIBLE', 'RESERVADA', 'BLOQUEADA', 'VENCIDA', 'DADA_DE_BAJA');

-- CreateTable
CREATE TABLE "solicitudes_transfusion" (
    "id" SERIAL NOT NULL,
    "dniPaciente" TEXT NOT NULL,
    "nombrePaciente" TEXT NOT NULL,
    "grupoABO" "GrupoSanguineoABO" NOT NULL,
    "factorRhD" "FactorRhD" NOT NULL,
    "tipoHemocomponente" "TipoHemocomponente" NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoSolicitudTransfusion" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "operador" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_transfusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_sangre" (
    "id" SERIAL NOT NULL,
    "numeroUnidad" TEXT NOT NULL,
    "tipoHemocomponente" "TipoHemocomponente" NOT NULL,
    "grupoABO" "GrupoSanguineoABO" NOT NULL,
    "factorRhD" "FactorRhD" NOT NULL,
    "fechaVencimiento" DATE NOT NULL,
    "estado" "EstadoUnidadSangre" NOT NULL DEFAULT 'DISPONIBLE',
    "solicitudId" INTEGER,
    "reservadaPor" TEXT,
    "reservadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_sangre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_transfusion_estado_fechaHora_idx" ON "solicitudes_transfusion"("estado", "fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_sangre_numeroUnidad_key" ON "unidades_sangre"("numeroUnidad");

-- CreateIndex
CREATE INDEX "unidades_sangre_estado_fechaVencimiento_idx" ON "unidades_sangre"("estado", "fechaVencimiento");

-- AddForeignKey
ALTER TABLE "unidades_sangre" ADD CONSTRAINT "unidades_sangre_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_transfusion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
