import type { ReactNode } from "react";

type Ancho = 2 | 3 | 4 | 6 | 8 | 12;

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  ancho?: Ancho;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, hint, error, ancho = 6, children }: FieldProps) {
  return (
    <div className={`field field--${ancho}`}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <>
            {" "}
            <span className="field__required" aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </label>
      {children}
      {error ? (
        <span className="field__error" role="alert">
          <span aria-hidden="true">!</span> {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
