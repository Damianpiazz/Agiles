import { Router } from "express";
import * as donanteController from "../controllers/donante.controller";
import * as entrevistaController from "../controllers/entrevista.controller";

const router = Router();
router.post("/", donanteController.create);
router.get("/", donanteController.search);
router.post("/:id/entrevistas", entrevistaController.create);
router.get("/:id", donanteController.getById);
export default router;