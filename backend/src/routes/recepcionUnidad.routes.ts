import { Router } from "express";
import * as recepcionUnidadController from "../controllers/recepcionUnidad.controller";
import * as bajaUnidadController from "../controllers/bajaUnidad.controller";

const router = Router();
router.post("/", recepcionUnidadController.create);
router.get("/", recepcionUnidadController.listar);
router.post("/:id/baja", bajaUnidadController.darDeBaja);
export default router;
