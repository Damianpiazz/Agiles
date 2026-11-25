import type { ReactNode } from "react";

type EmptyProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyProps) {
  return (
    <div className="ui-state">
      <span className="ui-state-icon" aria-hidden="true">
        ⌕
      </span>
      <p className="ui-state-title">{title}</p>
      {description ? <p className="ui-state-text">{description}</p> : null}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Cargando datos…" }: { label?: string }) {
  return (
    <div className="ui-state" role="status">
      <span className="ui-spinner" aria-hidden="true" />
      <p className="ui-state-text">{label}</p>
    </div>
  );
}
