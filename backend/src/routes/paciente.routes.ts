import { Router } from "express";
import * as pacienteController from "../controllers/paciente.controller";

const router = Router();

router.post("/", pacienteController.create);
router.get("/", pacienteController.search);

export default router;
