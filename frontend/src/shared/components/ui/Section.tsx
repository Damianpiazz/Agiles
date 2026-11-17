import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface SectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}

export function Section({ title, description, actions, children, flush = false }: SectionProps) {
  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h2 className="section__title">{title}</h2>
          {description ? <p className="section__description">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className={cn("section__body", flush && "section__body--flush")}>{children}</div>
    </section>
  );
}
