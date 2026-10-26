import { Router } from "express";
import * as tamizajeController from "../controllers/tamizajeInfecciones.controller";

const router = Router();

router.post("/", tamizajeController.crear);
router.get("/donacion/:donacionId", tamizajeController.listarPorDonacion);

export default router;
