CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "operador" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pacientes_dni_key" ON "pacientes"("dni");

ALTER TABLE "solicitudes_transfusion" ADD COLUMN "pacienteId" INTEGER;

CREATE INDEX "solicitudes_transfusion_pacienteId_idx" ON "solicitudes_transfusion"("pacienteId");

ALTER TABLE "solicitudes_transfusion"
ADD CONSTRAINT "solicitudes_transfusion_pacienteId_fkey"
FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
