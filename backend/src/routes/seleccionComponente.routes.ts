import { Router } from "express";
import * as emisionUnidadController from "../controllers/emisionUnidad.controller";
import * as seleccionComponenteController from "../controllers/seleccionComponente.controller";
import * as solicitudTransfusionController from "../controllers/solicitudTransfusion.controller";

const router = Router();

router.get("/", solicitudTransfusionController.listar);
router.post("/", solicitudTransfusionController.crear);
router.get(
  "/:solicitudId/unidades-compatibles",
  seleccionComponenteController.listarUnidadesCompatibles,
);
router.get(
  "/:solicitudId/unidades-reservadas",
  seleccionComponenteController.listarUnidadesReservadas,
);
router.get("/:solicitudId/emisiones", emisionUnidadController.listarPorSolicitud);
router.post(
  "/:solicitudId/unidades/:unidadId/reservar",
  seleccionComponenteController.reservarUnidad,
);
router.post(
  "/:solicitudId/unidades/:unidadId/emitir",
  emisionUnidadController.emitir,
);
router.post("/:solicitudId/aprobar", solicitudTransfusionController.aprobar);
router.post("/:solicitudId/cancelar", solicitudTransfusionController.cancelar);
router.get("/:solicitudId", solicitudTransfusionController.buscarPorId);
router.put("/:solicitudId", solicitudTransfusionController.actualizar);

export default router;
