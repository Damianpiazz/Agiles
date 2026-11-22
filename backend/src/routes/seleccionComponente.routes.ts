import { Router } from "express";
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
router.post(
  "/:solicitudId/unidades/:unidadId/reservar",
  seleccionComponenteController.reservarUnidad,
);
router.get("/:solicitudId", solicitudTransfusionController.buscarPorId);
router.put("/:solicitudId", solicitudTransfusionController.actualizar);
router.post("/:solicitudId/cancelar", solicitudTransfusionController.cancelar);

export default router;
