import { Router } from "express";
import * as pciController from "../controllers/pci.controller";

const router = Router();
router.post("/", pciController.create);
router.get("/", pciController.list);
router.get("/:id", pciController.getById);
export default router;
