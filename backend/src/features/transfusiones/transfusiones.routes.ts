import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import { createTransfusionSchema, updateTransfusionSchema } from "./transfusiones.schema";
import {
  actualizarTransfusion,
  crearTransfusion,
  eliminarTransfusion,
  listarTransfusiones,
  obtenerTransfusion,
  transfusionsDePersona,
} from "./transfusiones.service";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarTransfusiones(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/persona/:idPersona",
  asyncHandler(async (req, res) => {
    const items = await transfusionsDePersona(parseId(req.params.idPersona, "persona"));
    sendData(res, items, 200, { total: items.length });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerTransfusion(parseId(req.params.id, "transfusión")));
  }),
);

router.post(
  "/",
  validate({ body: createTransfusionSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearTransfusion(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updateTransfusionSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarTransfusion(parseId(req.params.id, "transfusión"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updateTransfusionSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarTransfusion(parseId(req.params.id, "transfusión"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarTransfusion(parseId(req.params.id, "transfusión"));
    sendNoContent(res);
  }),
);

export default router;
