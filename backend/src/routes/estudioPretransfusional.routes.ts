
import { Router } from "express";

import * as estudioController from "../controllers/estudioPretransfusional.controller";

const router = Router();

router.post(
  "/:solicitudId/estudios-pretransfusionales",
  estudioController.registrar,
);

router.get(
  "/:solicitudId/estudios-pretransfusionales",
  estudioController.listarPorSolicitud,
);

export default router;
