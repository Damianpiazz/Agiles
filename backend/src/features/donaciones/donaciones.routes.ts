import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import {
  createDonacionSchema,
  donacionCompletaSchema,
  guardarEstudiosSchema,
  updateDonacionSchema,
} from "./donaciones.schema";
import {
  actualizarDonacion,
  crearDonacion,
  crearDonacionCompleta,
  eliminarDonacion,
  estudiosDeDonacion,
  guardarEstudios,
  listarDonaciones,
  obtenerDonacion,
} from "./donaciones.service";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarDonaciones(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

/** Alta completa usada por la pantalla 04 (Posta fija). */
router.post(
  "/completa",
  validate({ body: donacionCompletaSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearDonacionCompleta(req.body));
  }),
);

router.get(
  "/:id/estudios",
  asyncHandler(async (req, res) => {
    sendData(res, await estudiosDeDonacion(parseId(req.params.id, "donación")));
  }),
);

router.put(
  "/:id/estudios",
  validate({ body: guardarEstudiosSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await guardarEstudios(parseId(req.params.id, "donación"), req.body));
  }),
);

router.post(
  "/:id/estudios",
  validate({ body: guardarEstudiosSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await guardarEstudios(parseId(req.params.id, "donación"), req.body));
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerDonacion(parseId(req.params.id, "donación")));
  }),
);

router.post(
  "/",
  validate({ body: createDonacionSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearDonacion(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updateDonacionSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarDonacion(parseId(req.params.id, "donación"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updateDonacionSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarDonacion(parseId(req.params.id, "donación"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarDonacion(parseId(req.params.id, "donación"));
    sendNoContent(res);
  }),
);

export default router;
