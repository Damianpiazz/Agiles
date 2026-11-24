-- CreateEnum
CREATE TYPE "TipoEstudioPretransfusional" AS ENUM ('TIPIFICACION_ABO_RHD', 'DETECCION_ANTICUERPOS', 'PRUEBA_CRUZADA');

-- CreateEnum
CREATE TYPE "ResultadoCompatibilidadPretransfusional" AS ENUM ('COMPATIBLE', 'INCOMPATIBLE');

-- CreateTable
CREATE TABLE "estudios_pretransfusionales" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "unidadSangreId" INTEGER,
    "tipo" "TipoEstudioPretransfusional" NOT NULL,
    "resultado" TEXT NOT NULL,
    "compatibilidad" "ResultadoCompatibilidadPretransfusional",
    "observaciones" TEXT,
    "operador" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estudios_pretransfusionales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estudios_pretransfusionales_solicitudId_fechaHora_idx" ON "estudios_pretransfusionales"("solicitudId", "fechaHora");

-- CreateIndex
CREATE INDEX "estudios_pretransfusionales_unidadSangreId_idx" ON "estudios_pretransfusionales"("unidadSangreId");

-- AddForeignKey
ALTER TABLE "estudios_pretransfusionales" ADD CONSTRAINT "estudios_pretransfusionales_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_transfusion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudios_pretransfusionales" ADD CONSTRAINT "estudios_pretransfusionales_unidadSangreId_fkey" FOREIGN KEY ("unidadSangreId") REFERENCES "unidades_sangre"("id") ON DELETE SET NULL ON UPDATE CASCADE;
