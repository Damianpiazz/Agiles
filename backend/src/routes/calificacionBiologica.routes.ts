import { Router } from "express";
import * as calificacionBiologicaController from "../controllers/calificacionBiologica.controller";

const router = Router();

router.post("/", calificacionBiologicaController.iniciar);

export default router;