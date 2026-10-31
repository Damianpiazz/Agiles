import { Router } from "express";
import * as recepcionUnidadController from "../controllers/recepcionUnidad.controller";

const router = Router();
router.post("/", recepcionUnidadController.create);
router.get("/", recepcionUnidadController.listar);
export default router;
