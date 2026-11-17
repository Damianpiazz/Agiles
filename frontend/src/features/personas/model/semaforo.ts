import type { Tono } from "@/shared/components/ui/StatusChip";
import type { Semaforo } from "../types";

const MAPA: Record<string, { etiqueta: string; tono: Tono; icono: string }> = {
  APTO: { etiqueta: "Apto para donar", tono: "ok", icono: "●" },
  REVISAR: { etiqueta: "En revisión", tono: "warn", icono: "▲" },
  EXCLUIDO: { etiqueta: "Excluido", tono: "danger", icono: "■" },
  SIN_ESTUDIOS: { etiqueta: "Sin estudios", tono: "neutral", icono: "○" },
};

export function presentacionSemaforo(semaforo: Semaforo | undefined) {
  if (!semaforo) return MAPA.SIN_ESTUDIOS;
  return MAPA[semaforo.estado] ?? MAPA.SIN_ESTUDIOS;
}
