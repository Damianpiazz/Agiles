import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface NoticeProps {
  tono: "info" | "warn" | "danger" | "critical";
  titulo?: string;
  children: ReactNode;
}

const CLASES: Record<NoticeProps["tono"], string> = {
  info: "chip--brand",
  warn: "chip--warn",
  danger: "chip--danger",
  critical: "chip--critical",
};

export function Notice({ tono, titulo, children }: NoticeProps) {
  return (
    <div className={`notice notice--${tono}`} role={tono === "danger" || tono === "critical" ? "alert" : "status"}>
      <strong className={cn("chip", CLASES[tono])}>{titulo ?? "Atención"}</strong>
      <span>{children}</span>
    </div>
  );
}
