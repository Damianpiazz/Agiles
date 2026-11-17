import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import {
  createRnSchema,
  rnCompletoSchema,
  updateRnSchema,
} from "./recien-nacidos.schema";
import {
  actualizarRecienNacido,
  crearRecienNacido,
  eliminarRecienNacido,
  guardarRecienNacidoCompleto,
  listarRecienNacidos,
  obtenerRecienNacido,
} from "./recien-nacidos.service";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarRecienNacidos(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.post(
  "/completa",
  validate({ body: rnCompletoSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await guardarRecienNacidoCompleto(req.body));
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerRecienNacido(parseId(req.params.id, "estudio de recién nacido")));
  }),
);

router.post(
  "/",
  validate({ body: createRnSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearRecienNacido(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updateRnSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarRecienNacido(parseId(req.params.id, "estudio de recién nacido"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updateRnSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarRecienNacido(parseId(req.params.id, "estudio de recién nacido"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarRecienNacido(parseId(req.params.id, "estudio de recién nacido"));
    sendNoContent(res);
  }),
);

export default router;
