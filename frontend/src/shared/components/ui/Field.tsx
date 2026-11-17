import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

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
  const hintId = htmlFor && hint ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const descritoPor = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  // Propaga id/aria al control interno sin obligar a cada llamada a repetirlos.
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        ...(htmlFor ? { id: htmlFor } : {}),
        ...(descritoPor ? { "aria-describedby": descritoPor } : {}),
        ...(error ? { "aria-invalid": true } : {}),
      })
    : children;

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
      {control}
      {hint ? (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="field__error" role="alert">
          <span aria-hidden="true">!</span> {error}
        </span>
      ) : null}
    </div>
  );
}
