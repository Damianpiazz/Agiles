-- AlterTable: DNI del paciente receptor cuando la donación es para reposición.
ALTER TABLE "donaciones_der" ADD COLUMN "dni_receptor_reposicion" TEXT;
