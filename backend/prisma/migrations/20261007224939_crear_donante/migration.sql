-- CreateEnum
CREATE TYPE "SexoBiologico" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateTable
CREATE TABLE "donantes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "lugarNacimiento" TEXT NOT NULL,
    "sexoBiologico" "SexoBiologico" NOT NULL,
    "domicilio" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefonoFijo" TEXT,
    "telefonoCelular" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donantes_dni_key" ON "donantes"("dni");
