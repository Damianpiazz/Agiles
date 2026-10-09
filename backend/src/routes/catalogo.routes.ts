import { Router } from "express";
import * as catalogoController from "../controllers/catalogo.controller";

const router = Router();
router.get("/antigenos", catalogoController.listarAntigenos);
router.get(
  "/determinaciones-serologicas",
  catalogoController.listarDeterminacionesSerologicas,
);
export default router;
