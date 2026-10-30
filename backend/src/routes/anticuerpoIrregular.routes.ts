import { Router } from "express";
import * as anticuerpoIrregularController from "../controllers/anticuerpoIrregular.controller";

const router = Router();

router.post("/", anticuerpoIrregularController.registrar);
router.get("/donacion/:donacionId", anticuerpoIrregularController.listarPorDonacion);
router.get("/:id", anticuerpoIrregularController.buscarPorId);

export default router;
