import { Router } from "express";
import * as recepcionUnidadController from "../controllers/recepcionUnidad.controller";
import * as bajaUnidadController from "../controllers/bajaUnidad.controller";
import * as emisionUnidadController from "../controllers/emisionUnidad.controller";

const router = Router();
router.post("/", recepcionUnidadController.create);
router.get("/", recepcionUnidadController.listar);
router.get("/:id/emisiones", emisionUnidadController.listarPorUnidad);
router.post("/:id/baja", bajaUnidadController.darDeBaja);
export default router;
