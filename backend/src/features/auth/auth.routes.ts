import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { sendData } from "../../lib/http";
import { authenticate, requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { loginSchema } from "./auth.schema";
import { login, obtenerPerfil } from "./auth.service";

const router = Router();

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await login(req.body));
  }),
);

router.get(
  "/me",
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerPerfil(req.user!.id));
  }),
);

router.post(
  "/logout",
  authenticate,
  requireAuth,
  asyncHandler(async (_req, res) => {
    sendData(res, { mensaje: "Sesión cerrada. Descartá el token en el cliente." });
  }),
);

export default router;
