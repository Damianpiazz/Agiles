-- Alta temporal de donantes: conserva el historial y oculta al donante de las búsquedas.
ALTER TABLE "donantes" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;
