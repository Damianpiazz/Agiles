-- DropForeignKey
ALTER TABLE "entrevistas_pre_donacion" DROP CONSTRAINT "entrevistas_pre_donacion_donacionId_fkey";

-- AddForeignKey
ALTER TABLE "entrevistas_pre_donacion" ADD CONSTRAINT "entrevistas_pre_donacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
