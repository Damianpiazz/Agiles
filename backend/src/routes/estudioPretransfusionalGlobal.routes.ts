import { Router } from "express";

import * as estudioController from "../controllers/estudioPretransfusional.controller";

const router = Router();

router.get("/", estudioController.listar);

export default router;
