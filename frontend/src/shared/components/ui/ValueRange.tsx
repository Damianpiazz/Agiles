import { formatoNumero } from "@/shared/utils/formato";

interface ValueRangeProps {
  etiqueta: string;
  valor: number | null | undefined;
  unidad: string;
  minimo: number;
  maximo: number;
  escalaMinima?: number;
  escalaMaxima?: number;
  precision?: number;
}

export function ValueRange({
  etiqueta,
  valor,
  unidad,
  minimo,
  maximo,
  escalaMinima = minimo * 0.7,
  escalaMaxima = maximo * 1.15,
  precision = 1,
}: ValueRangeProps) {
  const sinDato = valor === null || valor === undefined;
  const estado = sinDato
    ? { texto: "Sin dato", clase: "muted" }
    : valor < minimo
      ? { texto: "Por debajo del rango", clase: "chip--danger" }
      : valor > maximo
        ? { texto: "Por encima del rango", clase: "chip--danger" }
        : { texto: "Dentro de rango", clase: "chip--ok" };

  const rango = escalaMaxima - escalaMinima || 1;
  const porcentaje = (valor: number) => Math.min(100, Math.max(0, ((valor - escalaMinima) / rango) * 100));
  const inicio = porcentaje(minimo);
  const fin = porcentaje(maximo);
  const marcador = sinDato ? 0 : porcentaje(valor);

  return (
    <div className="value-range">
      <span className="value-range__label">{etiqueta}</span>
      <span className="value-range__value tabular">
        {sinDato ? "—" : formatoNumero(valor, precision > 0)} {unidad}
      </span>
      <div className="value-range__track" aria-hidden="true">
        <div className="value-range__band" style={{ left: `${inicio}%`, width: `${fin - inicio}%` }} />
        {sinDato ? null : <div className="value-range__marker" style={{ left: `${marcador}%` }} />}
      </div>
      <div className="value-range__status">
        <span className={`chip ${estado.clase}`}>{estado.texto}</span>
        <span className="muted">
          Referencia {formatoNumero(minimo)}–{formatoNumero(maximo)} {unidad}
        </span>
      </div>
    </div>
  );
}
