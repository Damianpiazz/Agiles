import { Router } from "express";
import * as personaHistorialController from "../controllers/personaHistorial.controller";

const router = Router();

router.get("/:dni/historial", personaHistorialController.consultar);

export default router;
