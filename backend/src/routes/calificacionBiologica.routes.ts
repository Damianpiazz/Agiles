import { Router } from "express";
import * as calificacionBiologicaController from "../controllers/calificacionBiologica.controller";

const router = Router();

router.post("/", calificacionBiologicaController.iniciar);
router.post(
  "/:donacionId/anticuerpos-irregulares",
  calificacionBiologicaController.registrarAnticuerposIrregulares,
);

export default router;