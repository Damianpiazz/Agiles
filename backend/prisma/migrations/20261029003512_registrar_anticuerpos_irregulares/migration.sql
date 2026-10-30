-- CreateEnum
CREATE TYPE "ResultadoAnticuerpoIrregular" AS ENUM ('POSITIVO', 'NEGATIVO');

-- CreateTable
CREATE TABLE "anticuerpos_irregulares" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "resultado" "ResultadoAnticuerpoIrregular" NOT NULL,
    "operador" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anticuerpos_irregulares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anticuerpos_irregulares_donacionId_key"
    ON "anticuerpos_irregulares"("donacionId");

-- CreateIndex
CREATE INDEX "anticuerpos_irregulares_donacionId_fechaHora_idx"
    ON "anticuerpos_irregulares"("donacionId", "fechaHora");

-- AddForeignKey
ALTER TABLE "anticuerpos_irregulares"
    ADD CONSTRAINT "anticuerpos_irregulares_donacionId_fkey"
    FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
