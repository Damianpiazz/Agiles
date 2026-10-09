import { Router } from "express";
import * as donacionController from "../controllers/donacion.controller";

const router = Router();
router.post("/", donacionController.create);
router.get("/:id", donacionController.getById);
export default router;
