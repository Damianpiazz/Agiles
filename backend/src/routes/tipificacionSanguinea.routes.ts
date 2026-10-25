
import { Router } from "express";
import * as tipificacionController from "../controllers/tipificacionSanguinea.controller";

const router = Router();

router.post("/", tipificacionController.crear);
router.get("/donacion/:donacionId", tipificacionController.listarPorDonacion);
router.get("/:id", tipificacionController.buscarPorId);

export default router;
