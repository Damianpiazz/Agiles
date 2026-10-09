import { Router } from "express";
import * as donanteController from "../controllers/donante.controller";

const router = Router();
router.post("/", donanteController.create);
router.get("/", donanteController.search);
router.get("/:id", donanteController.getById);
export default router;