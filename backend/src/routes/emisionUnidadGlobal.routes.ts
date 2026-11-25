import { Router } from "express";

import * as emisionUnidadController from "../controllers/emisionUnidad.controller";

const router = Router();

router.get("/", emisionUnidadController.listar);

export default router;
