-- CreateEnum
CREATE TYPE "ResultadoAdmision" AS ENUM ('ADMITIDO', 'DIFERIDO');

-- CreateTable
CREATE TABLE "donaciones" (
    "id" SERIAL NOT NULL,
    "donanteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrevistas_pre_donacion" (
    "id" SERIAL NOT NULL,
    "donanteId" INTEGER NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "respuestas" JSONB NOT NULL,
    "resultadoAdmision" "ResultadoAdmision" NOT NULL,
    "causaDiferimiento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrevistas_pre_donacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entrevistas_pre_donacion_donacionId_key" ON "entrevistas_pre_donacion"("donacionId");

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_donanteId_fkey" FOREIGN KEY ("donanteId") REFERENCES "donantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas_pre_donacion" ADD CONSTRAINT "entrevistas_pre_donacion_donanteId_fkey" FOREIGN KEY ("donanteId") REFERENCES "donantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas_pre_donacion" ADD CONSTRAINT "entrevistas_pre_donacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
