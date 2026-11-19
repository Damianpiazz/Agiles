-- CreateEnum
CREATE TYPE "MotivoBajaUnidad" AS ENUM ('VENCIDA', 'TRANSFUNDIDA', 'DESCARTADA');

-- AlterTable
ALTER TABLE "unidades_sangre" ADD COLUMN     "motivoBaja" "MotivoBajaUnidad",
ADD COLUMN     "operadorBaja" TEXT,
ADD COLUMN     "fechaBaja" TIMESTAMP(3);
