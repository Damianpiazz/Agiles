import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
};

export function FormField({
  id,
  label,
  children,
  error,
  hint,
  required = false,
  optional = false,
  className = "",
}: FieldProps) {
  return (
    <div className={`ui-field ${className}`.trim()}>
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="ui-required" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? <span className="ui-optional">Opcional</span> : null}
      </label>
      {children}
      {hint ? <p className="ui-hint">{hint}</p> : null}
      {error ? (
        <p className="ui-field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: SectionProps) {
  return (
    <fieldset className="ui-section">
      <legend>{title}</legend>
      {description ? <p className="ui-section-description">{description}</p> : null}
      {children}
    </fieldset>
  );
}

export function FormGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={`ui-form-grid ui-form-grid-${columns}`}>{children}</div>;
}
