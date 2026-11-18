import { useState } from "react";
import type { ItemCatalogo } from "@/features/catalogos/types";
import { Button } from "@/shared/components/ui/Button";

export interface ResultadoElegido {
  id: number;
  nombre: string;
  resultado: "Negativo" | "Positivo";
  observacion: string;
}

type OpcionResultado = ResultadoElegido["resultado"];

interface SelectorResultadosProps {
  items: ItemCatalogo[];
  valores: ResultadoElegido[];
  onChange: (valores: ResultadoElegido[]) => void;
  etiquetaItem: string;
  idAyuda: string;
}

/**
 * No renderiza todo el catálogo: el usuario elige qué determinaciones cargar
 * y solo aparecen las filas agregadas, con resultado Negativo/Positivo.
 */
export function SelectorResultados({ items, valores, onChange, etiquetaItem, idAyuda }: SelectorResultadosProps) {
  const [seleccionado, setSeleccionado] = useState("");

  const disponibles = items.filter((item) => !valores.some((valor) => valor.id === item.id));

  function agregar() {
    const item = disponibles.find((candidato) => String(candidato.id) === seleccionado);
    if (!item) return;
    onChange([
      ...valores,
      { id: item.id, nombre: item.nombre ?? `${etiquetaItem} ${item.id}`, resultado: "Negativo", observacion: "" },
    ]);
    setSeleccionado("");
  }

  function actualizar(id: number, campo: "resultado" | "observacion", valor: OpcionResultado | string) {
    onChange(
      valores.map((fila) =>
        fila.id === id ? { ...fila, [campo]: valor as never } : fila,
      ),
    );
  }

  return (
    <div className="selector-resultados">
      <div className="selector-resultados__alta">
        <select
          className="select"
          value={seleccionado}
          onChange={(evento) => setSeleccionado(evento.target.value)}
          aria-label={`Elegir ${etiquetaItem.toLowerCase()}`}
          aria-describedby={idAyuda}
        >
          <option value="">Seleccionar {etiquetaItem.toLowerCase()}…</option>
          {disponibles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre ?? `${etiquetaItem} ${item.id}`}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={agregar} disabled={!seleccionado}>
          Agregar
        </Button>
      </div>
      <p id={idAyuda} className="muted selector-resultados__ayuda">
        Elegí solo las {etiquetaItem.toLowerCase()} que querés cargar. Las demás no se muestran.
      </p>

      {valores.length === 0 ? (
        <p className="soft">No hay resultados cargados para este estudio.</p>
      ) : (
        <div className="selector-resultados__filas">
          {valores.map((fila) => (
            <div className="resultado-row" key={fila.id}>
              <span className="resultado-row__nombre">
                {fila.nombre}
                <button
                  type="button"
                  className="resultado-row__quitar"
                  onClick={() => onChange(valores.filter((valor) => valor.id !== fila.id))}
                  aria-label={`Quitar ${fila.nombre}`}
                >
                  Quitar
                </button>
              </span>
              <div className="resultado-row__opciones" role="group" aria-label={`Resultado de ${fila.nombre}`}>
                {(["Negativo", "Positivo"] as const).map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    className={`chip-resultado ${fila.resultado === opcion ? `chip-resultado--${opcion.toLowerCase()}` : ""}`}
                    aria-pressed={fila.resultado === opcion}
                    onClick={() => actualizar(fila.id, "resultado", opcion)}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
              <input
                className="input"
                value={fila.observacion}
                onChange={(evento) => actualizar(fila.id, "observacion", evento.target.value)}
                placeholder="Observación (opcional)"
                aria-label={`Observación de ${fila.nombre}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
