CREATE TYPE "ModalidadTransfusion" AS ENUM ('INTERNACION', 'AMBULATORIA', 'DOMICILIARIA');
CREATE TYPE "CaracterTransfusion" AS ENUM ('PROGRAMADA', 'NO_URGENTE', 'RESERVA', 'URGENTE', 'EMERGENCIA');
CREATE TYPE "AntecedenteTransfusional" AS ENUM ('SI', 'NO', 'IGNORADO');

ALTER TABLE "solicitudes_transfusion"
ADD COLUMN "modalidad" "ModalidadTransfusion",
ADD COLUMN "lugarRealizacion" TEXT,
ADD COLUMN "servicioSalaCama" TEXT,
ADD COLUMN "diagnosticoBase" TEXT,
ADD COLUMN "diagnosticoIndicacion" TEXT,
ADD COLUMN "antecedenteTransfusional" "AntecedenteTransfusional",
ADD COLUMN "reaccionTransfusionalPrev" "AntecedenteTransfusional",
ADD COLUMN "sensibilizacionObstetrica" "AntecedenteTransfusional",
ADD COLUMN "hematocrito" DOUBLE PRECISION,
ADD COLUMN "hemoglobina" DOUBLE PRECISION,
ADD COLUMN "plaquetas" INTEGER,
ADD COLUMN "fechaHoraLaboratorio" TIMESTAMP(3),
ADD COLUMN "volumenMl" INTEGER,
ADD COLUMN "irradiado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lavado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "desleucocitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fraccionadoPediatrico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "caracter" "CaracterTransfusion",
ADD COLUMN "fechaHoraRecepcion" TIMESTAMP(3),
ADD COLUMN "medicoPrescriptor" TEXT,
ADD COLUMN "firmaAclarada" TEXT,
ADD COLUMN "matriculaPrescriptor" TEXT;

CREATE TABLE "solicitudes_transfusion_auditoria" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "datoModificado" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "motivo" TEXT,
    "operador" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "solicitudes_transfusion_auditoria_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "solicitudes_transfusion_auditoria_solicitudId_fechaHora_idx"
ON "solicitudes_transfusion_auditoria"("solicitudId", "fechaHora");

ALTER TABLE "solicitudes_transfusion_auditoria"
ADD CONSTRAINT "solicitudes_transfusion_auditoria_solicitudId_fkey"
FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_transfusion"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
