import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { createCrudRouter } from "../../lib/crud-router";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import {
  createPcdResultadoSchema,
  createPcdSchema,
  updatePcdResultadoSchema,
  updatePcdSchema,
} from "./pcd.schema";
import { actualizarPcd, crearPcd, eliminarPcd, listarPcd, obtenerPcd } from "./pcd.service";

export const pcdResultadosRouter = createCrudRouter({
  label: "el resultado de PCD",
  singular: "el resultado de PCD",
  delegate: prisma.pcdResultado,
  filters: { idPcd: "number", idDeterminacionPcd: "number" },
  sortFields: ["id"],
  defaultSort: { id: "asc" },
  include: { determinacionPcd: true, pcd: true },
  schemas: { create: createPcdResultadoSchema, update: updatePcdResultadoSchema },
});

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarPcd(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerPcd(parseId(req.params.id, "PCD")));
  }),
);

router.post(
  "/",
  validate({ body: createPcdSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearPcd(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updatePcdSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarPcd(parseId(req.params.id, "PCD"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updatePcdSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarPcd(parseId(req.params.id, "PCD"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarPcd(parseId(req.params.id, "PCD"));
    sendNoContent(res);
  }),
);

export default router;
