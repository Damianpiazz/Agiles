import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { parseId } from "../../lib/crud";
import { badRequest } from "../../lib/errors";
import { sendCreated, sendData, sendNoContent } from "../../lib/http";
import { firstValue } from "../../lib/query";
import { validate } from "../../middlewares/validate";
import {
  createPersonaSchema,
  grupoFactorSchema,
  updatePersonaSchema,
} from "./personas.schema";
import {
  actualizarPersona,
  asignarGrupoFactor,
  buscarPersonas,
  buscarPorDni,
  crearPersona,
  donantesEnRevision,
  eliminarPersona,
  listarPersonas,
  obtenerHistorial,
  obtenerPersona,
  semaforoDePersona,
} from "./personas.service";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { items, meta } = await listarPersonas(req.query as Record<string, unknown>);
    sendData(res, items, 200, meta);
  }),
);

router.get(
  "/buscar",
  asyncHandler(async (req, res) => {
    const termino = firstValue(req.query.q);
    if (!termino) throw badRequest('El parámetro "q" es obligatorio para buscar');
    const items = await buscarPersonas(termino);
    sendData(res, items, 200, { total: items.length, termino });
  }),
);

router.get(
  "/dni/:dni",
  asyncHandler(async (req, res) => {
    sendData(res, await buscarPorDni(firstValue(req.params.dni) ?? ""));
  }),
);

router.get(
  "/revision",
  asyncHandler(async (_req, res) => {
    const items = await donantesEnRevision();
    sendData(res, items, 200, { total: items.length });
  }),
);

router.get(
  "/:id/historial",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerHistorial(parseId(req.params.id, "persona")));
  }),
);

router.get(
  "/:id/semaforo",
  asyncHandler(async (req, res) => {
    sendData(res, await semaforoDePersona(parseId(req.params.id, "persona")));
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    sendData(res, await obtenerPersona(parseId(req.params.id, "persona")));
  }),
);

router.post(
  "/",
  validate({ body: createPersonaSchema }),
  asyncHandler(async (req, res) => {
    sendCreated(res, await crearPersona(req.body));
  }),
);

router.post(
  "/:id/grupo-factor",
  validate({ body: grupoFactorSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await asignarGrupoFactor(parseId(req.params.id, "persona"), req.body));
  }),
);

router.put(
  "/:id",
  validate({ body: updatePersonaSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarPersona(parseId(req.params.id, "persona"), req.body));
  }),
);

router.patch(
  "/:id",
  validate({ body: updatePersonaSchema }),
  asyncHandler(async (req, res) => {
    sendData(res, await actualizarPersona(parseId(req.params.id, "persona"), req.body));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await eliminarPersona(parseId(req.params.id, "persona"));
    sendNoContent(res);
  }),
);

export default router;
