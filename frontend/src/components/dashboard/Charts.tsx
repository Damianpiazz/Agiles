import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { Conteo } from "../../types/dashboard";

export type SerieGrafico = { key: string; label: string; color: string };
export type DatoBarra = {
  label: string;
  valores: Record<string, number>;
};
export type DatoLinea = {
  fecha: string;
  [key: string]: string | number;
};

type Tooltip = { x: number; y: number; texto: string };

function usarTooltip() {
  const referencia = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  function mostrar(evento: MouseEvent<SVGElement>, texto: string) {
    const caja = referencia.current?.getBoundingClientRect();
    if (!caja) return;
    setTooltip({
      x: evento.clientX - caja.left,
      y: evento.clientY - caja.top,
      texto,
    });
  }

  function ocultar() {
    setTooltip(null);
  }

  return { referencia, tooltip, mostrar, ocultar };
}

function Leyenda({
  series,
  ocultas,
  alternar,
}: {
  series: SerieGrafico[];
  ocultas: string[];
  alternar: (key: string) => void;
}) {
  return (
    <div className="chart-legend" aria-label="Series del gráfico">
      {series.map((serie) => (
        <button
          key={serie.key}
          type="button"
          className={`chart-legend-item${ocultas.includes(serie.key) ? " is-hidden" : ""}`}
          aria-pressed={!ocultas.includes(serie.key)}
          onClick={() => alternar(serie.key)}
        >
          <span
            className="chart-legend-swatch"
            style={{ backgroundColor: serie.color }}
            aria-hidden="true"
          />
          {serie.label}
        </button>
      ))}
    </div>
  );
}

function Tooltip({ tooltip }: { tooltip: Tooltip | null }) {
  if (!tooltip) return null;
  return (
    <div
      className="chart-tooltip"
      role="tooltip"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {tooltip.texto}
    </div>
  );
}

function escalaMaxima(valor: number): number {
  if (valor <= 0) return 1;
  const magnitud = 10 ** Math.floor(Math.log10(valor));
  return Math.ceil(valor / magnitud) * magnitud;
}

/** Barras apiladas con tooltip, leyenda activable y click por categoría. */
export function BarrasApiladas({
  titulo,
  datos,
  series,
  onSelect,
  formatearEtiqueta,
}: {
  titulo: string;
  datos: DatoBarra[];
  series: SerieGrafico[];
  onSelect?: (label: string) => void;
  formatearEtiqueta?: (label: string) => string;
}) {
  const ancho = 640;
  const alto = 270;
  const izquierda = 38;
  const derecha = 12;
  const arriba = 14;
  const abajo = 56;
  const { referencia, tooltip, mostrar, ocultar } = usarTooltip();
  const [ocultas, setOcultas] = useState<string[]>([]);
  const visibles = series.filter((serie) => !ocultas.includes(serie.key));
  const totales = datos.map((dato) =>
    visibles.reduce((suma, serie) => suma + (dato.valores[serie.key] ?? 0), 0),
  );
  const maximo = escalaMaxima(Math.max(0, ...totales));
  const area = ancho - izquierda - derecha;
  const banda = area / Math.max(1, datos.length);
  const barra = Math.min(52, banda * 0.58);
  const alturaGrafico = alto - arriba - abajo;

  function alternar(key: string) {
    setOcultas((previas) =>
      previas.includes(key)
        ? previas.filter((item) => item !== key)
        : [...previas, key],
    );
  }

  if (datos.length === 0) {
    return <p className="chart-empty">Sin datos para mostrar en este período.</p>;
  }

  return (
    <div className="chart" ref={referencia}>
      <Leyenda series={series} ocultas={ocultas} alternar={alternar} />
      <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={titulo}>
        {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
          const y = arriba + alturaGrafico * (1 - factor);
          return (
            <g key={factor}>
              <line
                x1={izquierda}
                x2={ancho - derecha}
                y1={y}
                y2={y}
                className="chart-grid"
              />
              <text x={izquierda - 7} y={y + 4} className="chart-axis-label" textAnchor="end">
                {Math.round(maximo * factor)}
              </text>
            </g>
          );
        })}
        {datos.map((dato, indice) => {
          const centro = izquierda + banda * (indice + 0.5);
          let acumulado = 0;
          return (
            <g key={dato.label}>
              {visibles.map((serie) => {
                const valor = dato.valores[serie.key] ?? 0;
                if (valor <= 0) return null;
                const altura = (valor / maximo) * alturaGrafico;
                const y = arriba + alturaGrafico - acumulado - altura;
                acumulado += altura;
                return (
                  <rect
                    key={serie.key}
                    x={centro - barra / 2}
                    y={y}
                    width={barra}
                    height={altura}
                    rx={2}
                    fill={serie.color}
                    className={onSelect ? "chart-bar is-clickable" : "chart-bar"}
                    onMouseEnter={(evento) =>
                      mostrar(
                        evento,
                        `${formatearEtiqueta?.(dato.label) ?? dato.label}\n${serie.label}: ${valor}`,
                      )
                    }
                    onMouseLeave={ocultar}
                    onClick={() => onSelect?.(dato.label)}
                  />
                );
              })}
              <text
                x={centro}
                y={alto - abajo + 20}
                className="chart-axis-label"
                textAnchor="middle"
              >
                {formatearEtiqueta?.(dato.label) ?? dato.label}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

/** Series temporales con tooltip por día, leyenda activable y click por fecha. */
export function GraficoLineas({
  titulo,
  datos,
  series,
  onSelect,
}: {
  titulo: string;
  datos: DatoLinea[];
  series: SerieGrafico[];
  onSelect?: (fecha: string) => void;
}) {
  const ancho = 640;
  const alto = 270;
  const izquierda = 38;
  const derecha = 12;
  const arriba = 14;
  const abajo = 44;
  const { referencia, tooltip, mostrar, ocultar } = usarTooltip();
  const [ocultas, setOcultas] = useState<string[]>([]);
  const visibles = series.filter((serie) => !ocultas.includes(serie.key));
  const maximo = escalaMaxima(
    Math.max(
      0,
      ...datos.flatMap((dato) =>
        visibles.map((serie) => Number(dato[serie.key]) || 0),
      ),
    ),
  );
  const alturaGrafico = alto - arriba - abajo;
  const area = ancho - izquierda - derecha;
  const paso = datos.length > 1 ? area / (datos.length - 1) : 0;
  const etiquetaCada = Math.max(1, Math.ceil(datos.length / 6));

  function alternar(key: string) {
    setOcultas((previas) =>
      previas.includes(key)
        ? previas.filter((item) => item !== key)
        : [...previas, key],
    );
  }

  if (datos.length === 0) {
    return <p className="chart-empty">Sin datos para mostrar en este período.</p>;
  }

  return (
    <div className="chart" ref={referencia}>
      <Leyenda series={series} ocultas={ocultas} alternar={alternar} />
      <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={titulo}>
        {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
          const y = arriba + alturaGrafico * (1 - factor);
          return (
            <g key={factor}>
              <line
                x1={izquierda}
                x2={ancho - derecha}
                y1={y}
                y2={y}
                className="chart-grid"
              />
              <text x={izquierda - 7} y={y + 4} className="chart-axis-label" textAnchor="end">
                {Math.round(maximo * factor)}
              </text>
            </g>
          );
        })}
        {visibles.map((serie) => {
          const puntos = datos
            .map((dato, indice) => {
              const x = izquierda + paso * indice;
              const y =
                arriba +
                alturaGrafico -
                ((Number(dato[serie.key]) || 0) / maximo) * alturaGrafico;
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polyline
              key={serie.key}
              points={puntos}
              fill="none"
              stroke={serie.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
        {datos.map((dato, indice) => {
          const x = izquierda + paso * indice;
          const anchoZona = datos.length > 1 ? paso : area;
          return (
            <g key={dato.fecha}>
              {visibles.map((serie) => (
                <circle
                  key={serie.key}
                  cx={x}
                  cy={
                    arriba +
                    alturaGrafico -
                    ((Number(dato[serie.key]) || 0) / maximo) * alturaGrafico
                  }
                  r={2.6}
                  fill={serie.color}
                />
              ))}
              <rect
                x={x - anchoZona / 2}
                y={arriba}
                width={anchoZona}
                height={alturaGrafico}
                fill="transparent"
                className={onSelect ? "chart-hit is-clickable" : "chart-hit"}
                onMouseEnter={(evento) =>
                  mostrar(
                    evento,
                    [
                      formatearFechaCorta(dato.fecha),
                      ...visibles.map(
                        (serie) => `${serie.label}: ${Number(dato[serie.key]) || 0}`,
                      ),
                    ].join("\n"),
                  )
                }
                onMouseLeave={ocultar}
                onClick={() => onSelect?.(dato.fecha)}
              />
              {(indice % etiquetaCada === 0 || indice === datos.length - 1) && (
                <text
                  x={x}
                  y={alto - abajo + 20}
                  className="chart-axis-label"
                  textAnchor="middle"
                >
                  {formatearFechaCorta(dato.fecha)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

function formatearFechaCorta(fecha: string): string {
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}`;
}

/** Distribuciones en barras horizontales, legibles y con click opcional. */
export function BarrasHorizontales({
  titulo,
  datos,
  color = "var(--color-primary)",
  onSelect,
  formatearEtiqueta,
}: {
  titulo: string;
  datos: Conteo[];
  color?: string;
  onSelect?: (label: string) => void;
  formatearEtiqueta?: (label: string) => string;
}) {
  const maximo = Math.max(1, ...datos.map((dato) => dato.value));

  if (datos.length === 0) {
    return <p className="chart-empty">Sin datos para mostrar en este período.</p>;
  }

  return (
    <div className="hbar-list" role="img" aria-label={titulo}>
      {datos.map((dato) => (
        <button
          key={dato.label}
          type="button"
          className={`hbar-row${onSelect ? " is-clickable" : ""}`}
          disabled={!onSelect}
          title={`${formatearEtiqueta?.(dato.label) ?? dato.label}: ${dato.value}`}
          onClick={() => onSelect?.(dato.label)}
        >
          <span className="hbar-label">
            {formatearEtiqueta?.(dato.label) ?? dato.label}
          </span>
          <span className="hbar-track">
            <span
              className="hbar-fill"
              style={{
                width: `${(dato.value / maximo) * 100}%`,
                backgroundColor: color,
              }}
            />
          </span>
          <strong className="hbar-value">{dato.value}</strong>
        </button>
      ))}
    </div>
  );
}
