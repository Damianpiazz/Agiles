import { Router } from "express";
import * as seleccionComponenteController from "../controllers/seleccionComponente.controller";

const router = Router();

router.get("/", seleccionComponenteController.listar);
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

export default router;
