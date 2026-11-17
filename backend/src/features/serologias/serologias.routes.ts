import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { createCrudRouter } from "../../lib/crud-router";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { validate } from "../../middlewares/validate";
import {
  createSerologiaResultadoSchema,
  createSerologiaSchema,
  linkDonacionSchema,
  updateSerologiaResultadoSchema,
  updateSerologiaSchema,
} from "./serologias.schema";
import {
  actualizarSerologia,
  crearSerologia,
  desvincularDonacion,
  eliminarSerologia,
  listarSerologias,
  obtenerSerologia,
  vincularDonacion,
} from "./serologias.service";

export const serologiaResultadosRouter = createCrudRouter({
  label: "el resultado serológico",
  singular: "el resultado serológico",
  delegate: prisma.serologiaResultado,
  filters: { serologiaId: "number", determinacionSerologicaId: "number" },
  sortFields: ["id", "resultado"],
  defaultSort: { id: "asc" },
  include: { determinacionSerologica: true, serologia: true },
  schemas: { create: createSerologiaResultadoSchema, update: updateSerologiaResultadoSchema },
});

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarSerologias(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerSerologia(parseId(req.params.id, "serología")));
  }),
);

router.post(
  "/",
  validate({ body: createSerologiaSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearSerologia(req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updateSerologiaSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarSerologia(parseId(req.params.id, "serología"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updateSerologiaSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarSerologia(parseId(req.params.id, "serología"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarSerologia(parseId(req.params.id, "serología"));
    sendNoContent(res);
  }),
);

router.post(
  "/:id/donaciones",
  validate({ body: linkDonacionSchema }),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await vincularDonacion(parseId(req.params.id, "serología"), req.body.idDonacion),
    );
  }),
);

router.delete(
  "/:id/donaciones/:idDonacion",
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await desvincularDonacion(
        parseId(req.params.id, "serología"),
        parseId(req.params.idDonacion, "donación"),
      ),
    );
  }),
);

export default router;
