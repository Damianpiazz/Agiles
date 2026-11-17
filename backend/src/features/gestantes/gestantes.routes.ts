import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { createCrudRouter } from "../../lib/crud-router";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import {
  createGestantePciSchema,
  createGestanteSchema,
  gestanteCompletaSchema,
  updateGestantePciSchema,
  updateGestanteSchema,
} from "./gestantes.schema";
import {
  actualizarGestante,
  crearGestante,
  eliminarGestante,
  guardarGestanteCompleta,
  listarGestantes,
  listarPorPersona,
  obtenerGestante,
} from "./gestantes.service";

export const gestantesPciRouter = createCrudRouter({
  label: "el vínculo PCI–gestante",
  singular: "el vínculo PCI–gestante",
  delegate: prisma.pciInmunohematologicoGestante,
  filters: { idPci: "number", idEstudiosInmunohematologicosGestante: "number" },
  sortFields: ["id"],
  defaultSort: { id: "asc" },
  include: {
    pci: { include: { resultados: { include: { antigeno: true } } } },
    estudioGestante: true,
  },
  schemas: { create: createGestantePciSchema, update: updateGestantePciSchema },
});

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarGestantes(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.post(
  "/completa",
  validate({ body: gestanteCompletaSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await guardarGestanteCompleta(req.body));
  }),
);

router.get(
  "/paciente/:idPersona",
  asyncHandler(async (req, res) => {
    sendData(res, await listarPorPersona(parseId(req.params.idPersona, "persona")));
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerGestante(parseId(req.params.id, "estudio de gestante")));
  }),
);

router.post(
  "/",
  validate({ body: createGestanteSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearGestante(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updateGestanteSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarGestante(parseId(req.params.id, "estudio de gestante"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updateGestanteSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarGestante(parseId(req.params.id, "estudio de gestante"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarGestante(parseId(req.params.id, "estudio de gestante"));
    sendNoContent(res);
  }),
);

export default router;
