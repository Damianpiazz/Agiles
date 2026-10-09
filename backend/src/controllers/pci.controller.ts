import type { Request, Response } from "express";
import { z } from "zod";
import * as pciService from "../services/pci.service";
import { crearPciSchema, idPciSchema, filtroPciSchema } from "../types/pci.types";
import { formatearFecha, formatearHora } from "../utils/formato";

type PciRegistro = {
  id: number;
  fecha: Date;
  hora: Date;
  observaciones: string | null;
  resultados: unknown[];
  donaciones: unknown[];
};

function mapearPci(pci: unknown): unknown {
  const p = pci as PciRegistro;
  return {
    ...p,
    fecha: formatearFecha(p.fecha),
    hora: formatearHora(p.hora),
  };
}

export async function create(req: Request, res: Response) {
  const parsed = crearPciSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      campos: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const pci = await pciService.create(parsed.data);
    return res.status(201).json(mapearPci(pci));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function getById(req: Request, res: Response) {
  const parsed = idPciSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "ID de PCI inválido" });
  }

  try {
    const pci = await pciService.buscarPorId(parsed.data);

    if (!pci) {
      return res.status(404).json({ error: "PCI no encontrado" });
    }

    return res.status(200).json(mapearPci(pci));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function list(req: Request, res: Response) {
  const parsed = filtroPciSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Filtro inválido" });
  }

  try {
    const pcis = await pciService.listar(parsed.data);
    return res.status(200).json((pcis as unknown[]).map(mapearPci));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
}
