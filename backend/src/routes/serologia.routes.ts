import { Router } from "express";
import * as serologiaController from "../controllers/serologia.controller";

const router = Router();
router.post("/", serologiaController.create);
router.get("/", serologiaController.list);
router.get("/:id", serologiaController.getById);
export default router;
