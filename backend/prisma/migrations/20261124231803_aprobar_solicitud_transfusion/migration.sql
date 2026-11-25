-- AlterTable
ALTER TABLE "solicitudes_transfusion" ADD COLUMN     "aprobadaPor" TEXT,
ADD COLUMN     "fechaHoraAprobacion" TIMESTAMP(3),
ADD COLUMN     "opinionMedica" TEXT;
