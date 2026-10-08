import { Router } from "express";
import * as donanteController from "../controllers/donante.controller";

const router = Router();
router.post("/", donanteController.create);
export default router;