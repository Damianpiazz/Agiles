-- AlterEnum
ALTER TYPE "EstadoUnidadSangre" ADD VALUE 'EMITIDA';

-- CreateTable
CREATE TABLE "emisiones_unidad" (
    "id" SERIAL NOT NULL,
    "unidadSangreId" INTEGER NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "pacienteId" INTEGER,
    "dniPaciente" TEXT NOT NULL,
    "nombrePaciente" TEXT NOT NULL,
    "grupoABOReceptor" "GrupoSanguineoABO" NOT NULL,
    "factorRhDReceptor" "FactorRhD" NOT NULL,
    "numeroUnidad" TEXT NOT NULL,
    "tipoHemocomponente" "TipoHemocomponente" NOT NULL,
    "grupoABOUnidad" "GrupoSanguineoABO" NOT NULL,
    "factorRhDUnidad" "FactorRhD" NOT NULL,
    "fechaVencimientoUnidad" DATE NOT NULL,
    "caracter" "CaracterTransfusion",
    "requisitosEspeciales" TEXT,
    "resultadoCompatibilidad" "ResultadoCompatibilidadPretransfusional",
    "compatibilidadCompleta" BOOLEAN NOT NULL,
    "responsable" TEXT NOT NULL,
    "observaciones" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emisiones_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emisiones_unidad_unidadSangreId_fechaHora_idx" ON "emisiones_unidad"("unidadSangreId", "fechaHora");

-- CreateIndex
CREATE INDEX "emisiones_unidad_solicitudId_idx" ON "emisiones_unidad"("solicitudId");

-- AddForeignKey
ALTER TABLE "emisiones_unidad" ADD CONSTRAINT "emisiones_unidad_unidadSangreId_fkey" FOREIGN KEY ("unidadSangreId") REFERENCES "unidades_sangre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emisiones_unidad" ADD CONSTRAINT "emisiones_unidad_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_transfusion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
