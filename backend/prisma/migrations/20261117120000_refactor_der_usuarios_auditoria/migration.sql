-- ============================================================
-- Refactor DER: personas, donaciones, inmunohematología,
-- transfusiones, catálogos, usuarios y auditoría.
-- ============================================================

-- CreateEnum
CREATE TYPE "TipoMuestraSerologia" AS ENUM ('PRIMERA', 'SEGUNDA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'TECNICO_HEMOTERAPIA', 'CONSULTA_MATERNIDAD');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- AlterTable: columnas nuevas en tablas preexistentes
ALTER TABLE "pci" ADD COLUMN "operador" TEXT;
ALTER TABLE "serologias" ADD COLUMN "tipo_muestra" "TipoMuestraSerologia";
ALTER TABLE "serologias" ADD COLUMN "operador" TEXT;

-- CreateTable
CREATE TABLE "provincias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_postal" TEXT,
    "id_provincia" INTEGER NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domicilios" (
    "id" SERIAL NOT NULL,
    "calle" TEXT,
    "numero" TEXT,
    "piso" TEXT,
    "departamento" TEXT,
    "id_ciudad" INTEGER NOT NULL,

    CONSTRAINT "domicilios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyf" (
    "id" SERIAL NOT NULL,
    "grupo" TEXT,
    "factor" TEXT,

    CONSTRAINT "gyf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "dni" TEXT,
    "historia_clinica" TEXT,
    "nombre" TEXT,
    "apellido" TEXT,
    "telefono" TEXT,
    "fecha_nacimiento" DATE,
    "lugar_nacimiento" TEXT,
    "sexo_biologico" "SexoBiologico",
    "id_direccion" INTEGER,
    "id_grupo_factor" INTEGER,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaciones_der" (
    "id" SERIAL NOT NULL,
    "peso" DOUBLE PRECISION,
    "tension_arterial" TEXT,
    "hemoglobina" DOUBLE PRECISION,
    "fecha" DATE,
    "voluntario" BOOLEAN,
    "reposicion" BOOLEAN,
    "autoexcluido" BOOLEAN,
    "observaciones" TEXT,
    "operador" TEXT,
    "id_persona" INTEGER,

    CONSTRAINT "donaciones_der_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serologia_donaciones_der" (
    "id" SERIAL NOT NULL,
    "id_serologia" INTEGER NOT NULL,
    "id_donacion" INTEGER NOT NULL,

    CONSTRAINT "serologia_donaciones_der_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pci_donaciones_der" (
    "id" SERIAL NOT NULL,
    "id_pci" INTEGER NOT NULL,
    "id_donacion" INTEGER NOT NULL,

    CONSTRAINT "pci_donaciones_der_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcd" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "operador" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "pcd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "determinaciones_pcd" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "determinaciones_pcd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcd_resultados" (
    "id" SERIAL NOT NULL,
    "resultado" TEXT,
    "valor" TEXT,
    "unidad" TEXT,
    "observacion" TEXT,
    "id_pcd" INTEGER NOT NULL,
    "id_determinacion_pcd" INTEGER,

    CONSTRAINT "pcd_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudios_inmunohematologicos_gestantes" (
    "id" SERIAL NOT NULL,
    "numero" TEXT,
    "fecha" DATE,
    "operador" TEXT,
    "id_persona" INTEGER NOT NULL,

    CONSTRAINT "estudios_inmunohematologicos_gestantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pci_inmunohematologicos_gestantes" (
    "id" SERIAL NOT NULL,
    "id_pci" INTEGER NOT NULL,
    "id_estudios_inmunohematologicos_gestantes" INTEGER NOT NULL,

    CONSTRAINT "pci_inmunohematologicos_gestantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudios_inmunohematologicos_rn" (
    "id" SERIAL NOT NULL,
    "numero" TEXT,
    "fecha" DATE,
    "rn" TEXT,
    "dni" TEXT,
    "id_madre" INTEGER,
    "id_grupo_factor" INTEGER,
    "IP_anti_D" TEXT,
    "id_pcd" INTEGER,
    "id_pci" INTEGER,
    "operador" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "estudios_inmunohematologicos_rn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obra_social" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,

    CONSTRAINT "obra_social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,

    CONSTRAINT "medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sangrias_terapeuticas" (
    "id" SERIAL NOT NULL,
    "diagnostico" TEXT,
    "extraccion" TEXT,
    "reposicion" TEXT,
    "fecha" DATE,
    "tecnico" TEXT,
    "id_persona" INTEGER,
    "id_obra_social" INTEGER,
    "id_medico" INTEGER,

    CONSTRAINT "sangrias_terapeuticas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fenotipos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,

    CONSTRAINT "fenotipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_transfusion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,

    CONSTRAINT "tipo_transfusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfusiones" (
    "id" SERIAL NOT NULL,
    "numero_o_lote" TEXT,
    "RT" TEXT,
    "tolerancia" TEXT,
    "pci" TEXT,
    "pcd" TEXT,
    "anticuerpo" TEXT,
    "fecha" DATE,
    "tecnico" TEXT,
    "id_persona" INTEGER,
    "id_fenotipo_1" INTEGER,
    "id_grupo_factor" INTEGER,
    "id_fenotipo_2" INTEGER,
    "id_tipo_transfusion" INTEGER,

    CONSTRAINT "transfusiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'TECNICO_HEMOTERAPIA',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER,
    "usuario" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "detalle" TEXT,
    "metodo" TEXT,
    "ruta" TEXT,
    "ip" TEXT,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ciudades_id_provincia_idx" ON "ciudades"("id_provincia");

-- CreateIndex
CREATE INDEX "domicilios_id_ciudad_idx" ON "domicilios"("id_ciudad");

-- CreateIndex
CREATE UNIQUE INDEX "personas_dni_key" ON "personas"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "personas_historia_clinica_key" ON "personas"("historia_clinica");

-- CreateIndex
CREATE INDEX "personas_id_direccion_idx" ON "personas"("id_direccion");

-- CreateIndex
CREATE INDEX "personas_id_grupo_factor_idx" ON "personas"("id_grupo_factor");

-- CreateIndex
CREATE INDEX "donaciones_der_id_persona_idx" ON "donaciones_der"("id_persona");

-- CreateIndex
CREATE INDEX "serologia_donaciones_der_id_serologia_idx" ON "serologia_donaciones_der"("id_serologia");

-- CreateIndex
CREATE INDEX "serologia_donaciones_der_id_donacion_idx" ON "serologia_donaciones_der"("id_donacion");

-- CreateIndex
CREATE INDEX "pci_donaciones_der_id_pci_idx" ON "pci_donaciones_der"("id_pci");

-- CreateIndex
CREATE INDEX "pci_donaciones_der_id_donacion_idx" ON "pci_donaciones_der"("id_donacion");

-- CreateIndex
CREATE UNIQUE INDEX "determinaciones_pcd_nombre_key" ON "determinaciones_pcd"("nombre");

-- CreateIndex
CREATE INDEX "pcd_resultados_id_pcd_idx" ON "pcd_resultados"("id_pcd");

-- CreateIndex
CREATE INDEX "pcd_resultados_id_determinacion_pcd_idx" ON "pcd_resultados"("id_determinacion_pcd");

-- CreateIndex
CREATE INDEX "estudios_inmunohematologicos_gestantes_id_persona_idx" ON "estudios_inmunohematologicos_gestantes"("id_persona");

-- CreateIndex
CREATE INDEX "pci_inmunohematologicos_gestantes_id_pci_idx" ON "pci_inmunohematologicos_gestantes"("id_pci");

-- CreateIndex
CREATE INDEX "pci_inmunohematologicos_gestantes_id_estudios_inmunohematol_idx" ON "pci_inmunohematologicos_gestantes"("id_estudios_inmunohematologicos_gestantes");

-- CreateIndex
CREATE INDEX "estudios_inmunohematologicos_rn_id_madre_idx" ON "estudios_inmunohematologicos_rn"("id_madre");

-- CreateIndex
CREATE INDEX "estudios_inmunohematologicos_rn_id_grupo_factor_idx" ON "estudios_inmunohematologicos_rn"("id_grupo_factor");

-- CreateIndex
CREATE INDEX "estudios_inmunohematologicos_rn_id_pcd_idx" ON "estudios_inmunohematologicos_rn"("id_pcd");

-- CreateIndex
CREATE INDEX "estudios_inmunohematologicos_rn_id_pci_idx" ON "estudios_inmunohematologicos_rn"("id_pci");

-- CreateIndex
CREATE INDEX "sangrias_terapeuticas_id_persona_idx" ON "sangrias_terapeuticas"("id_persona");

-- CreateIndex
CREATE INDEX "sangrias_terapeuticas_id_obra_social_idx" ON "sangrias_terapeuticas"("id_obra_social");

-- CreateIndex
CREATE INDEX "sangrias_terapeuticas_id_medico_idx" ON "sangrias_terapeuticas"("id_medico");

-- CreateIndex
CREATE INDEX "transfusiones_id_fenotipo_1_idx" ON "transfusiones"("id_fenotipo_1");

-- CreateIndex
CREATE INDEX "transfusiones_id_grupo_factor_idx" ON "transfusiones"("id_grupo_factor");

-- CreateIndex
CREATE INDEX "transfusiones_id_fenotipo_2_idx" ON "transfusiones"("id_fenotipo_2");

-- CreateIndex
CREATE INDEX "transfusiones_id_tipo_transfusion_idx" ON "transfusiones"("id_tipo_transfusion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE INDEX "auditoria_fecha_hora_idx" ON "auditoria"("fecha_hora");

-- CreateIndex
CREATE INDEX "auditoria_usuario_idx" ON "auditoria"("usuario");

-- CreateIndex
CREATE INDEX "auditoria_entidad_idx" ON "auditoria"("entidad");

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_id_provincia_fkey" FOREIGN KEY ("id_provincia") REFERENCES "provincias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domicilios" ADD CONSTRAINT "domicilios_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_id_direccion_fkey" FOREIGN KEY ("id_direccion") REFERENCES "domicilios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_id_grupo_factor_fkey" FOREIGN KEY ("id_grupo_factor") REFERENCES "gyf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones_der" ADD CONSTRAINT "donaciones_der_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serologia_donaciones_der" ADD CONSTRAINT "serologia_donaciones_der_id_serologia_fkey" FOREIGN KEY ("id_serologia") REFERENCES "serologias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serologia_donaciones_der" ADD CONSTRAINT "serologia_donaciones_der_id_donacion_fkey" FOREIGN KEY ("id_donacion") REFERENCES "donaciones_der"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_donaciones_der" ADD CONSTRAINT "pci_donaciones_der_id_pci_fkey" FOREIGN KEY ("id_pci") REFERENCES "pci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_donaciones_der" ADD CONSTRAINT "pci_donaciones_der_id_donacion_fkey" FOREIGN KEY ("id_donacion") REFERENCES "donaciones_der"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcd_resultados" ADD CONSTRAINT "pcd_resultados_id_pcd_fkey" FOREIGN KEY ("id_pcd") REFERENCES "pcd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcd_resultados" ADD CONSTRAINT "pcd_resultados_id_determinacion_pcd_fkey" FOREIGN KEY ("id_determinacion_pcd") REFERENCES "determinaciones_pcd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudios_inmunohematologicos_gestantes" ADD CONSTRAINT "estudios_inmunohematologicos_gestantes_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_inmunohematologicos_gestantes" ADD CONSTRAINT "pci_inmunohematologicos_gestantes_id_pci_fkey" FOREIGN KEY ("id_pci") REFERENCES "pci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pci_inmunohematologicos_gestantes" ADD CONSTRAINT "pci_inmunohematologicos_gestantes_id_estudios_inmunohema_fkey" FOREIGN KEY ("id_estudios_inmunohematologicos_gestantes") REFERENCES "estudios_inmunohematologicos_gestantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudios_inmunohematologicos_rn" ADD CONSTRAINT "estudios_inmunohematologicos_rn_id_madre_fkey" FOREIGN KEY ("id_madre") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudios_inmunohematologicos_rn" ADD CONSTRAINT "estudios_inmunohematologicos_rn_id_grupo_factor_fkey" FOREIGN KEY ("id_grupo_factor") REFERENCES "gyf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudios_inmunohematologicos_rn" ADD CONSTRAINT "estudios_inmunohematologicos_rn_id_pcd_fkey" FOREIGN KEY ("id_pcd") REFERENCES "pcd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudios_inmunohematologicos_rn" ADD CONSTRAINT "estudios_inmunohematologicos_rn_id_pci_fkey" FOREIGN KEY ("id_pci") REFERENCES "pci"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sangrias_terapeuticas" ADD CONSTRAINT "sangrias_terapeuticas_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sangrias_terapeuticas" ADD CONSTRAINT "sangrias_terapeuticas_id_obra_social_fkey" FOREIGN KEY ("id_obra_social") REFERENCES "obra_social"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sangrias_terapeuticas" ADD CONSTRAINT "sangrias_terapeuticas_id_medico_fkey" FOREIGN KEY ("id_medico") REFERENCES "medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_id_fenotipo_1_fkey" FOREIGN KEY ("id_fenotipo_1") REFERENCES "fenotipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_id_grupo_factor_fkey" FOREIGN KEY ("id_grupo_factor") REFERENCES "gyf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_id_fenotipo_2_fkey" FOREIGN KEY ("id_fenotipo_2") REFERENCES "fenotipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_id_tipo_transfusion_fkey" FOREIGN KEY ("id_tipo_transfusion") REFERENCES "tipo_transfusion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
