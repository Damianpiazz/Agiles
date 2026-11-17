import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createUsuarioSchema, updateUsuarioSchema } from "./usuarios.schema";
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerUsuario,
} from "./usuarios.service";

const router = Router();

router.get(
  "/",
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarUsuarios(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/:id",
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerUsuario(parseId(req.params.id, "usuario")));
  }),
);

router.post(
  "/",
  requireRole("ADMINISTRADOR"),
  validate({ body: createUsuarioSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearUsuario(req.body));
  }),
);

router.put(
  "/:id",
  requireRole("ADMINISTRADOR"),
  validate({ body: updateUsuarioSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarUsuario(parseId(req.params.id, "usuario"), req.body));
  }),
);

router.patch(
  "/:id",
  requireRole("ADMINISTRADOR"),
  validate({ body: updateUsuarioSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarUsuario(parseId(req.params.id, "usuario"), req.body));
  }),
);

router.delete(
  "/:id",
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (req, res) => {
    await eliminarUsuario(parseId(req.params.id, "usuario"));
    sendNoContent(res);
  }),
);

export default router;
