-- CreateEnum
CREATE TYPE "EstadoCalificacionBiologica" AS ENUM ('INICIADA');

-- CreateTable
CREATE TABLE "calificaciones_biologicas" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "estado" "EstadoCalificacionBiologica" NOT NULL DEFAULT 'INICIADA',
    "operador" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calificaciones_biologicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_biologicas_donacionId_key" ON "calificaciones_biologicas"("donacionId");

-- AddForeignKey
ALTER TABLE "calificaciones_biologicas" ADD CONSTRAINT "calificaciones_biologicas_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
