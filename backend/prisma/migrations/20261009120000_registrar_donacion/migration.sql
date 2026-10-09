-- CreateEnum
CREATE TYPE "EstadoDonacion" AS ENUM ('REGISTRADA', 'EN_CALIFICACION', 'CALIFICADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "donaciones" (
    "id" SERIAL NOT NULL,
    "donanteId" INTEGER NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador" TEXT NOT NULL,
    "estado" "EstadoDonacion" NOT NULL DEFAULT 'REGISTRADA',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donaciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_donanteId_fkey" FOREIGN KEY ("donanteId") REFERENCES "donantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
