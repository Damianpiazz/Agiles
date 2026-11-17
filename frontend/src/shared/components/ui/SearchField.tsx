import type { FormEvent } from "react";
import { Button } from "./Button";

interface SearchFieldProps {
  value: string;
  onChange: (valor: string) => void;
  onSubmit: () => void;
  label: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  submitLabel = "Buscar",
  autoFocus = false,
  disabled = false,
}: SearchFieldProps) {
  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onSubmit();
  }

  return (
    <form className="form-grid" onSubmit={manejarEnvio}>
      <div className="field field--8">
        <label className="field__label" htmlFor="busqueda-unificada">
          {label}
        </label>
        <input
          id="busqueda-unificada"
          className="input input--data"
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      <div className="field field--4" style={{ alignSelf: "end" }}>
        <Button type="submit" variant="primary" disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
