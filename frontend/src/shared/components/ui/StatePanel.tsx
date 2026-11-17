import { Button } from "./Button";

interface StatePanelProps {
  titulo: string;
  mensaje?: string;
  onReintentar?: () => void;
}

export function StatePanel({ titulo, mensaje, onReintentar }: StatePanelProps) {
  return (
    <div className="state-panel" role="status">
      <span className="state-panel__title">{titulo}</span>
      {mensaje ? <p className="state-panel__message">{mensaje}</p> : null}
      {onReintentar ? (
        <Button type="button" onClick={onReintentar} size="sm">
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingPanel() {
  return (
    <div className="state-panel" role="status" aria-label="Cargando datos">
      <div className="skeleton-line" style={{ width: "60%" }} />
      <div className="skeleton-line" style={{ width: "85%" }} />
      <div className="skeleton-line" style={{ width: "40%" }} />
    </div>
  );
}
