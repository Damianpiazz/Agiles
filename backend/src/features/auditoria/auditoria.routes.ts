import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { sendData } from "../../lib/http";
import { requireRole } from "../../middlewares/auth";
import { listarAuditoria, obtenerAuditoria, opcionesAuditoria } from "./auditoria.service";

const router = Router();

router.use(requireRole("ADMINISTRADOR"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarAuditoria(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/opciones",
  asyncHandler(async (_req, res) => {
    sendData(res, await opcionesAuditoria());
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerAuditoria(parseId(req.params.id, "evento de auditoría")));
  }),
);

export default router;
