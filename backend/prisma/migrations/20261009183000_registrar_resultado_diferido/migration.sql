-- CreateEnum
CREATE TYPE "TipoDiferimiento" AS ENUM ('TEMPORAL', 'PERMANENTE');

-- AlterTable
ALTER TABLE "entrevistas_pre_donacion"
ADD COLUMN "tipoDiferimiento" "TipoDiferimiento",
ADD COLUMN "entrevistador" TEXT,
ALTER COLUMN "donacionId" DROP NOT NULL;
