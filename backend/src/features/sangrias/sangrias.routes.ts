import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import { createSangriaSchema, updateSangriaSchema } from "./sangrias.schema";
import {
  actualizarSangria,
  crearSangria,
  eliminarSangria,
  listarSangrias,
  obtenerSangria,
  sangriasDePersona,
} from "./sangrias.service";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarSangrias(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/persona/:idPersona",
  asyncHandler(async (req, res) => {
    const items = await sangriasDePersona(parseId(req.params.idPersona, "persona"));
    sendData(res, items, 200, { total: items.length });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerSangria(parseId(req.params.id, "sangría terapéutica")));
  }),
);

router.post(
  "/",
  validate({ body: createSangriaSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearSangria(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updateSangriaSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarSangria(parseId(req.params.id, "sangría terapéutica"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updateSangriaSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarSangria(parseId(req.params.id, "sangría terapéutica"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarSangria(parseId(req.params.id, "sangría terapéutica"));
    sendNoContent(res);
  }),
);

export default router;
