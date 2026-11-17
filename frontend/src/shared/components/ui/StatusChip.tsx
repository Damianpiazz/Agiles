import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type Tono = "neutral" | "brand" | "ok" | "warn" | "danger" | "critical";

interface StatusChipProps {
  tono?: Tono;
  icono?: string;
  children: ReactNode;
}

export function StatusChip({ tono = "neutral", icono, children }: StatusChipProps) {
  return (
    <span className={cn("chip", `chip--${tono}`)}>
      {icono ? <span aria-hidden="true">{icono}</span> : null}
      {children}
    </span>
  );
}
