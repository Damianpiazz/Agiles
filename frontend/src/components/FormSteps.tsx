type Props = {
  pasos: readonly string[];
  actual: number;
};

export function FormSteps({ pasos, actual }: Props) {
  return (
    <ol className="ui-steps" aria-label="Progreso del formulario">
      {pasos.map((paso, indice) => (
        <li
          key={paso}
          className={`ui-step${indice === actual ? " is-current" : ""}${indice < actual ? " is-done" : ""}`}
          aria-current={indice === actual ? "step" : undefined}
        >
          <span className="ui-step-number" aria-hidden="true">
            {indice < actual ? "✓" : indice + 1}
          </span>
          <span className="ui-step-label">{paso}</span>
        </li>
      ))}
    </ol>
  );
}
