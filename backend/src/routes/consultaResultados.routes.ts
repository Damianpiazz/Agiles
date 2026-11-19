import { Router } from "express";
import * as consultaResultadosController from "../controllers/consultaResultados.controller";

const router = Router();

router.get(
  "/donante/:dni",
  consultaResultadosController.consultarPorDniController,
);

export default router;