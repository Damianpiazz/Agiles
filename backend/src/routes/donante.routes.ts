import { Router } from "express";
import * as donanteController from "../controllers/donante.controller";
import * as entrevistaController from "../controllers/entrevista.controller";

const router = Router();
router.post("/", donanteController.create);
router.get("/", donanteController.search);
router.get("/listado", donanteController.listar);
router.patch("/:id/baja", donanteController.darDeBaja);
router.post("/:id/entrevistas", entrevistaController.create);
router.get("/:id/entrevista-pendiente", entrevistaController.getPending);
router.get("/:id", donanteController.getById);
router.put("/:id", donanteController.update);
export default router;
