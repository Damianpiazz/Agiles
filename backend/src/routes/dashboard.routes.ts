import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

router.get("/resumen", dashboardController.resumen);

export default router;
