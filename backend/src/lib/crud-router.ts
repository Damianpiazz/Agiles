import { Router } from "express";
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { asyncHandler } from "./async-handler";
import { createCrudService, parseId } from "./crud";
import type { CrudOptions } from "./crud";
import { sendCreated, sendData, sendNoContent } from "./http";
import { validate } from "../middlewares/validate";

export interface CrudRouterOptions extends CrudOptions {
  /** Esquemas opcionales de validación para alta y edición. */
  schemas?: {
    create?: ZodType;
    update?: ZodType;
  };
  /** Middlewares adicionales aplicados a todas las rutas del recurso. */
  middlewares?: RequestHandler[];
  /** Prefijo usado en los mensajes, por ejemplo "la provincia". */
  singular?: string;
}

/**
 * Genera un router CRUD completo (listar, ver, crear, editar y borrar)
 * a partir de una configuración declarativa del modelo.
 */
export function createCrudRouter(options: CrudRouterOptions): Router {
  const service = createCrudService(options);
  const singular = options.singular ?? options.label;
  const router = Router();
  const middlewares = options.middlewares ?? [];

  if (middlewares.length) router.use(...middlewares);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { items, meta } = await service.list(req.query);
      sendData(res, items, 200, meta);
    }),
  );

  router.post(
    "/",
    ...(options.schemas?.create ? [validate({ body: options.schemas.create })] : []),
    asyncHandler(async (req, res) => {
      const row = await service.create(req.body);
      sendCreated(res, row);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const row = await service.getById(parseId(req.params.id, singular));
      sendData(res, row);
    }),
  );

  router.put(
    "/:id",
    ...(options.schemas?.update ? [validate({ body: options.schemas.update })] : []),
    asyncHandler(async (req, res) => {
      const row = await service.update(parseId(req.params.id, singular), req.body);
      sendData(res, row);
    }),
  );

  router.patch(
    "/:id",
    ...(options.schemas?.update ? [validate({ body: options.schemas.update })] : []),
    asyncHandler(async (req, res) => {
      const row = await service.update(parseId(req.params.id, singular), req.body);
      sendData(res, row);
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await service.remove(parseId(req.params.id, singular));
      sendNoContent(res);
    }),
  );

  return router;
}
