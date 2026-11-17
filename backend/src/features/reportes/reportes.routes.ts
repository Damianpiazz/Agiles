import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { sendCsv } from "../../lib/csv";
import { sendData } from "../../lib/http";
import { firstValue, parseDateRange, type RawQuery } from "../../lib/query";
import {
  reporteHemo1,
  reporteHemo2,
  reporteHemo3,
  reporteHemo4,
  reporteHemo5,
  resumenHemo,
} from "./reportes.service";

const router = Router();

function periodoDe(query: RawQuery) {
  const rango = parseDateRange(query);
  return {
    desde: rango.gte ? rango.gte.toISOString().slice(0, 10) : null,
    hasta: rango.lte ? rango.lte.toISOString().slice(0, 10) : null,
  };
}

function quiereCsv(query: RawQuery): boolean {
  const formato = firstValue(query.formato)?.toLowerCase();
  return formato === "csv";
}

function responder(
  req: RawQuery,
  res: Response,
  nombre: string,
  datos: Record<string, unknown>,
  filas: Array<Record<string, unknown>>,
): void {
  if (quiereCsv(req)) {
    sendCsv(res, `${nombre}.csv`, filas);
    return;
  }
  sendData(res, { periodo: periodoDe(req), ...datos });
}

function filasResumen(datos: Record<string, unknown>): Array<Record<string, unknown>> {
  const aptitud = datos.aptitud as Record<string, number> | undefined;
  return [
    { indicador: "Donantes atendidos", valor: datos.donantesAtendidos ?? 0 },
    { indicador: "Donantes únicos", valor: datos.donantesUnicos ?? 0 },
    { indicador: "Hemocomponentes transfundidos", valor: datos.hemocomponentesTransfundidos ?? 0 },
    { indicador: "Unidades descartadas", valor: datos.unidadesDescartadas ?? 0 },
    { indicador: "Gestantes estudiadas", valor: datos.gestantesEstudiadas ?? 0 },
    { indicador: "Recién nacidos estudiados", valor: datos.recienNacidosEstudiados ?? 0 },
    { indicador: "Sangrías terapéuticas", valor: datos.sangriasTerapeuticas ?? 0 },
    { indicador: "Donantes aptos", valor: aptitud?.aptos ?? 0 },
    { indicador: "Donantes excluidos", valor: aptitud?.excluidos ?? 0 },
    { indicador: "Donantes en revisión", valor: aptitud?.enRevision ?? 0 },
  ];
}

router.get(
  "/hemo/resumen",
  asyncHandler(async (req, res) => {
    const query = req.query as RawQuery;
    const datos = await resumenHemo(query);
    responder(query, res, "hemo-resumen", datos, filasResumen(datos));
  }),
);

router.get(
  "/hemo/1",
  asyncHandler(async (req, res) => {
    const query = req.query as RawQuery;
    const datos = await reporteHemo1(query);
    responder(query, res, "hemo-1-donantes", datos, datos.detalle);
  }),
);

router.get(
  "/hemo/2",
  asyncHandler(async (req, res) => {
    const query = req.query as RawQuery;
    const datos = await reporteHemo2(query);
    responder(query, res, "hemo-2-hemocomponentes", datos, datos.detalle);
  }),
);

router.get(
  "/hemo/3",
  asyncHandler(async (req, res) => {
    const query = req.query as RawQuery;
    const datos = await reporteHemo3(query);
    responder(query, res, "hemo-3-transfusiones", datos, datos.detalle);
  }),
);

router.get(
  "/hemo/4",
  asyncHandler(async (req, res) => {
    const query = req.query as RawQuery;
    const datos = await reporteHemo4(query);
    responder(query, res, "hemo-4-reacciones", datos, datos.detalle);
  }),
);

router.get(
  "/hemo/5",
  asyncHandler(async (req, res) => {
    const query = req.query as RawQuery;
    const datos = await reporteHemo5(query);
    responder(query, res, "hemo-5-gestantes-rn", datos, datos.detalle);
  }),
);

export default router;
