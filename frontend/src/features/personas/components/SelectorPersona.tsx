import { useQuery } from "@tanstack/react-query";
import { personasApi } from "@/features/personas/api/personas.api";
import type { Persona } from "@/features/personas/types";
import { Field } from "@/shared/components/ui/Field";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { documentoLegible, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

interface SelectorPersonaProps {
  valor: string;
  onChange: (valor: string) => void;
  onSeleccionar: (persona: Persona) => void;
  label?: string;
  placeholder?: string;
}

export function SelectorPersona({
  valor,
  onChange,
  onSeleccionar,
  label = "Paciente / donante",
  placeholder = "Buscar por DNI, nombre o HC",
}: SelectorPersonaProps) {
  const termino = useDebouncedValue(valor.trim(), 250);
  const resultados = useQuery({
    queryKey: ["personas", "buscar", termino],
    queryFn: () => personasApi.buscar(termino),
    enabled: termino.length >= 3,
  });

  return (
    <Field label={label} htmlFor="selector-persona" ancho={6} hint="Escribí al menos 3 caracteres para buscar">
      <input
        id="selector-persona"
        className="input"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {resultados.isLoading ? <span className="field__hint">Buscando…</span> : null}
      {resultados.data && resultados.data.length > 0 ? (
        <div className="selector-list" role="listbox" aria-label="Personas encontradas">
          {resultados.data.slice(0, 6).map((persona) => (
            <button
              key={persona.id}
              type="button"
              className="selector-list__item"
              onClick={() => onSeleccionar(persona)}
            >
              <span>
                <strong>{nombreCompleto(persona)}</strong>
                <span className="muted mono"> DNI {documentoLegible(persona.dni)}</span>
              </span>
              <span className="muted">{grupoFactorLegible(persona.grupoFactor)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </Field>
  );
}
