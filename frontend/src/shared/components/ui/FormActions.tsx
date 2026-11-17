import type { ReactNode } from "react";
import { Button } from "./Button";

interface FormActionsProps {
  onCancel?: () => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  extra?: ReactNode;
}

export function FormActions({ onCancel, submitLabel, loading, disabled, extra }: FormActionsProps) {
  return (
    <div className="form-actions">
      {extra}
      {onCancel ? (
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
      ) : null}
      <Button type="submit" variant="primary" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  );
}
