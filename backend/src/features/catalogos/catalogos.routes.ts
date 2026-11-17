import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { createCrudRouter } from "../../lib/crud-router";
import { sendData } from "../../lib/http";
import {
  createAntigenoSchema,
  createDeterminacionPcdSchema,
  createDeterminacionSerologicaSchema,
  createFenotipoSchema,
  createGyfSchema,
  createMedicoSchema,
  createObraSocialSchema,
  createTipoTransfusionSchema,
  updateAntigenoSchema,
  updateDeterminacionPcdSchema,
  updateDeterminacionSerologicaSchema,
  updateFenotipoSchema,
  updateGyfSchema,
  updateMedicoSchema,
  updateObraSocialSchema,
  updateTipoTransfusionSchema,
} from "./catalogos.schema";

export const gruposFactorRouter = createCrudRouter({
  label: "el grupo y factor",
  singular: "el grupo y factor",
  delegate: prisma.gyf,
  searchFields: ["grupo", "factor"],
  sortFields: ["id", "grupo", "factor"],
  defaultSort: { grupo: "asc" },
  schemas: { create: createGyfSchema, update: updateGyfSchema },
});

export const obrasSocialesRouter = createCrudRouter({
  label: "la obra social",
  singular: "la obra social",
  delegate: prisma.obraSocial,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createObraSocialSchema, update: updateObraSocialSchema },
});

export const medicosRouter = createCrudRouter({
  label: "el médico",
  singular: "el médico",
  delegate: prisma.medico,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createMedicoSchema, update: updateMedicoSchema },
});

export const determinacionesSerologicasRouter = createCrudRouter({
  label: "la determinación serológica",
  singular: "la determinación serológica",
  delegate: prisma.determinacionSerologica,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createDeterminacionSerologicaSchema, update: updateDeterminacionSerologicaSchema },
});

export const determinacionesPcdRouter = createCrudRouter({
  label: "la determinación de PCD",
  singular: "la determinación de PCD",
  delegate: prisma.determinacionPcd,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createDeterminacionPcdSchema, update: updateDeterminacionPcdSchema },
});

export const antigenosRouter = createCrudRouter({
  label: "el antígeno",
  singular: "el antígeno",
  delegate: prisma.antigeno,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createAntigenoSchema, update: updateAntigenoSchema },
});

export const fenotiposRouter = createCrudRouter({
  label: "el fenotipo",
  singular: "el fenotipo",
  delegate: prisma.fenotipo,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createFenotipoSchema, update: updateFenotipoSchema },
});

export const tiposTransfusionRouter = createCrudRouter({
  label: "el tipo de transfusión",
  singular: "el tipo de transfusión",
  delegate: prisma.tipoTransfusion,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  schemas: { create: createTipoTransfusionSchema, update: updateTipoTransfusionSchema },
});

/** Catálogo consolidado para la pantalla 12. */
export const catalogosRouter = Router();

catalogosRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [
      provincias,
      ciudades,
      gruposFactor,
      obrasSociales,
      medicos,
      determinacionesSerologicas,
      determinacionesPcd,
      antigenos,
      fenotipos,
      tiposTransfusion,
    ] = await Promise.all([
      prisma.provincia.findMany({ include: { ciudades: { orderBy: { nombre: "asc" } } }, orderBy: { nombre: "asc" } }),
      prisma.ciudad.findMany({ include: { provincia: true }, orderBy: { nombre: "asc" } }),
      prisma.gyf.findMany({ orderBy: [{ grupo: "asc" }, { factor: "asc" }] }),
      prisma.obraSocial.findMany({ orderBy: { nombre: "asc" } }),
      prisma.medico.findMany({ orderBy: { nombre: "asc" } }),
      prisma.determinacionSerologica.findMany({ orderBy: { nombre: "asc" } }),
      prisma.determinacionPcd.findMany({ orderBy: { nombre: "asc" } }),
      prisma.antigeno.findMany({ orderBy: { nombre: "asc" } }),
      prisma.fenotipo.findMany({ orderBy: { nombre: "asc" } }),
      prisma.tipoTransfusion.findMany({ orderBy: { nombre: "asc" } }),
    ]);

    sendData(res, {
      provincias,
      ciudades,
      gruposFactor,
      obrasSociales,
      medicos,
      determinacionesSerologicas,
      determinacionesPcd,
      antigenos,
      fenotipos,
      tiposTransfusion,
    });
  }),
);

export const catalogosCrudRouter = Router();
catalogosCrudRouter.use("/grupos-factor", gruposFactorRouter);
catalogosCrudRouter.use("/obras-sociales", obrasSocialesRouter);
catalogosCrudRouter.use("/medicos", medicosRouter);
catalogosCrudRouter.use("/determinaciones-serologicas", determinacionesSerologicasRouter);
catalogosCrudRouter.use("/determinaciones-pcd", determinacionesPcdRouter);
catalogosCrudRouter.use("/antigenos", antigenosRouter);
catalogosCrudRouter.use("/fenotipos", fenotiposRouter);
catalogosCrudRouter.use("/tipos-transfusion", tiposTransfusionRouter);
