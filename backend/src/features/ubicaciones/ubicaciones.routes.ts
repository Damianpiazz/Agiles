import { Router } from "express";
import { prisma } from "../../config/prisma";
import { createCrudRouter } from "../../lib/crud-router";
import {
  createCiudadSchema,
  createDomicilioSchema,
  createProvinciaSchema,
  updateCiudadSchema,
  updateDomicilioSchema,
  updateProvinciaSchema,
} from "./ubicaciones.schema";

export const provinciasRouter = createCrudRouter({
  label: "la provincia",
  singular: "la provincia",
  delegate: prisma.provincia,
  searchFields: ["nombre"],
  sortFields: ["id", "nombre"],
  defaultSort: { nombre: "asc" },
  include: { ciudades: { orderBy: { nombre: "asc" } } },
  schemas: { create: createProvinciaSchema, update: updateProvinciaSchema },
});

export const ciudadesRouter = createCrudRouter({
  label: "la ciudad",
  singular: "la ciudad",
  delegate: prisma.ciudad,
  searchFields: ["nombre", "codigoPostal"],
  filters: { idProvincia: "number" },
  sortFields: ["id", "nombre", "codigoPostal"],
  defaultSort: { nombre: "asc" },
  include: { provincia: true },
  schemas: { create: createCiudadSchema, update: updateCiudadSchema },
});

export const domiciliosRouter = createCrudRouter({
  label: "el domicilio",
  singular: "el domicilio",
  delegate: prisma.domicilio,
  searchFields: ["calle", "numero", "piso", "departamento"],
  filters: { idCiudad: "number" },
  sortFields: ["id", "calle", "numero"],
  defaultSort: { id: "desc" },
  include: { ciudad: { include: { provincia: true } } },
  schemas: { create: createDomicilioSchema, update: updateDomicilioSchema },
});

export const ubicacionesRouter = Router();
ubicacionesRouter.use("/provincias", provinciasRouter);
ubicacionesRouter.use("/ciudades", ciudadesRouter);
ubicacionesRouter.use("/domicilios", domiciliosRouter);
