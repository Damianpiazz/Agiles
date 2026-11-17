import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { createCrudRouter } from "../../lib/crud-router";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import {
  createPciResultadoSchema,
  createPciSchema,
  linkDonacionSchema,
  updatePciResultadoSchema,
  updatePciSchema,
} from "./pci.schema";
import {
  actualizarPci,
  crearPci,
  desvincularPciDonacion,
  eliminarPci,
  listarPci,
  obtenerPci,
  vincularPciDonacion,
} from "./pci.service";

export const pciResultadosRouter = createCrudRouter({
  label: "el resultado de PCI",
  singular: "el resultado de PCI",
  delegate: prisma.pciResultado,
  filters: { pciId: "number", antigenoId: "number" },
  sortFields: ["id", "resultado"],
  defaultSort: { id: "asc" },
  include: { antigeno: true, pci: true },
  schemas: { create: createPciResultadoSchema, update: updatePciResultadoSchema },
});

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarPci(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerPci(parseId(req.params.id, "PCI")));
  }),
);

router.post(
  "/",
  validate({ body: createPciSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearPci(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updatePciSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarPci(parseId(req.params.id, "PCI"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updatePciSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarPci(parseId(req.params.id, "PCI"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarPci(parseId(req.params.id, "PCI"));
    sendNoContent(res);
  }),
);

router.post(
  "/:id/donaciones",
  validate({ body: linkDonacionSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await vincularPciDonacion(parseId(req.params.id, "PCI"), req.body.idDonacion));
  }),
);

router.delete(
  "/:id/donaciones/:idDonacion",
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await desvincularPciDonacion(
        parseId(req.params.id, "PCI"),
        parseId(req.params.idDonacion, "donación"),
      ),
    );
  }),
);

export default router;
