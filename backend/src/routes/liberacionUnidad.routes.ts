import { Router } from "express";
import * as liberacionController from "../controllers/liberacionUnidad.controller";

const router = Router();

router.get(
  "/:donacionId/evaluacion",
  liberacionController.evaluar,
);

router.post(
  "/:donacionId/estado",
  liberacionController.cambiarEstado,
);

export default router;