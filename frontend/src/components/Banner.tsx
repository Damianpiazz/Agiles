import type { ReactNode } from "react";

export type BannerTone = "ok" | "error" | "aviso" | "info";

type Props = {
  tone: BannerTone;
  children: ReactNode;
  role?: "status" | "alert";
};

const iconos: Record<BannerTone, string> = {
  ok: "✓",
  error: "!",
  aviso: "△",
  info: "i",
};

export function Banner({ tone, children, role }: Props) {
  return (
    <div
      className={`ui-banner ui-banner-${tone}`}
      role={role ?? (tone === "error" ? "alert" : "status")}
    >
      <span className="ui-banner-icon" aria-hidden="true">
        {iconos[tone]}
      </span>
      <span>{children}</span>
    </div>
  );
}
