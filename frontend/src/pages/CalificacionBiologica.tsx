import { useState } from "react";
import "../styles/CalificacionBiologica.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type Resultado = {
creada: boolean;
calificacion: {
id: number;
donacionId: number;
estado: string;
operador: string;
fechaInicio: string;
};
};

type ResultadoAnticuerpoIrregular = {
id: number;
donacionId: number;
donanteId: number | null;
resultado: "POSITIVO" | "NEGATIVO";
operador: string;
fechaHora: string;
observacion?: string | null;
etiquetaComponente: string;
indicacion: string;
advertenciaPlasma: string | null;
notificacionDonante: string | null;
};

export default function CalificacionBiologica() {
const [donacionId, setDonacionId] = useState("");
const [operador, setOperador] = useState("");
const [resultado, setResultado] = useState<Resultado | null>(null);
const [resultadoAnticuerpo, setResultadoAnticuerpo] = useState<ResultadoAnticuerpoIrregular | null>(null);
const [resultadoIrregular, setResultadoIrregular] = useState<"POSITIVO" | "NEGATIVO">("NEGATIVO");
const [observacion, setObservacion] = useState("");
const [error, setError] = useState("");
const [cargando, setCargando] = useState(false);

const esResultadoInmune = resultadoAnticuerpo?.resultado === "POSITIVO";
const puedeRegistrarResultado = Boolean(resultado);

async function iniciarCalificacion(
e: React.FormEvent<HTMLFormElement>
) {
e.preventDefault();
setError("");
setResultado(null);
setResultadoAnticuerpo(null);

const id = Number(donacionId);

if (!Number.isInteger(id) || id <= 0) {
  setError("Ingresá un ID de donación válido.");
  return;
}

if (!operador.trim()) {
  setError("Ingresá el nombre del operador.");
  return;
}

setCargando(true);

try {
  const respuesta = await fetch(
    `${API_URL}/api/calificaciones-biologicas`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        donacionId: id,
        operador: operador.trim(),
      }),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || "No se pudo iniciar la calificación."
    );
  }

  setResultado(datos as Resultado);
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "No se pudo conectar con el servidor."
  );
} finally {
  setCargando(false);
}

}

async function registrarAnticuerposIrregulares(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();
  setError("");

  const id = Number(donacionId);

  if (!Number.isInteger(id) || id <= 0) {
    setError("Ingresá un ID de donación válido para registrar el resultado.");
    return;
  }

  if (!operador.trim()) {
    setError("Ingresá el nombre del operador antes de registrar el resultado.");
    return;
  }

  setCargando(true);

  try {
    const respuesta = await fetch(
      `${API_URL}/api/calificaciones-biologicas/${id}/anticuerpos-irregulares`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultado: resultadoIrregular,
          operador: operador.trim(),
              observacion: observacion.trim() || undefined,
            }),
          }
        );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error || "No se pudo registrar el resultado de anticuerpos irregulares."
      );
    }

    setResultadoAnticuerpo(datos as ResultadoAnticuerpoIrregular);
    setObservacion("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "No se pudo conectar con el servidor."
    );
  } finally {
    setCargando(false);
  }
}

return (
<main className="calificacion-container">
<h1>Calificación biológica</h1>

  <p>
    Iniciá la calificación biológica de una donación previamente registrada.
  </p>

  <form
    onSubmit={iniciarCalificacion}
    className="calificacion-form"
  >
    <label htmlFor="donacionId">ID de la donación</label>
    <input
      id="donacionId"
      type="number"
      min="1"
      step="1"
      value={donacionId}
      onChange={(e) => setDonacionId(e.target.value)}
      required
    />

    <label htmlFor="operador">Operador</label>
    <input
      id="operador"
      type="text"
      maxLength={120}
      value={operador}
      onChange={(e) => setOperador(e.target.value)}
      placeholder="Nombre del operador"
      required
    />

    <button type="submit" disabled={cargando}>
      {cargando ? "Procesando..." : "Iniciar calificación"}
    </button>
  </form>

  {error && (
    <p className="calificacion-error" role="alert">
      {error}
    </p>
  )}

  {resultado && (
    <section
      className="calificacion-resultado"
      aria-live="polite"
    >
      <h2>
        {resultado.creada
          ? "Calificación iniciada correctamente"
          : "La donación ya tenía una calificación"}
      </h2>

      <p>
        <strong>ID de calificación:</strong>{" "}
        {resultado.calificacion.id}
      </p>

      <p>
        <strong>ID de donación:</strong>{" "}
        {resultado.calificacion.donacionId}
      </p>

      <p>
        <strong>Estado:</strong>{" "}
        {resultado.calificacion.estado}
      </p>

      <p>
        <strong>Operador:</strong>{" "}
        {resultado.calificacion.operador}
      </p>

      <p>
        <strong>Fecha de inicio:</strong>{" "}
        {new Date(
          resultado.calificacion.fechaInicio
        ).toLocaleString()}
      </p>
    </section>
  )}

  {puedeRegistrarResultado && (
    <form
      onSubmit={registrarAnticuerposIrregulares}
      className="calificacion-form"
    >
      <h2>Resultado inmune / detección de anticuerpos irregulares</h2>
      <p>Registrar la respuesta del estudio inmunohematológico para decidir manejo especial previo a la liberación.</p>

      <label htmlFor="resultadoIrregular">Resultado</label>
      <select
        id="resultadoIrregular"
        value={resultadoIrregular}
        onChange={(e) =>
          setResultadoIrregular(e.target.value as "POSITIVO" | "NEGATIVO")
        }
      >
        <option value="NEGATIVO">Negativo</option>
        <option value="POSITIVO">Positivo</option>
      </select>

      <label htmlFor="observacionAnticuerpo">Observación operatoria</label>
      <textarea
        id="observacionAnticuerpo"
        value={observacion}
        onChange={(e) => setObservacion(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="Ej.: unidad con reacción inmune; requiere manejo especial antes de la liberación."
      />

      <button type="submit" disabled={cargando}>
        {cargando ? "Procesando..." : "Guardar resultado"}
      </button>
    </form>
  )}

  {resultadoAnticuerpo && (
    <section
      className={`calificacion-resultado ${esResultadoInmune ? "resultado-inmune" : "resultado-estable"}`}
      aria-live="polite"
    >
      <h2>
        {esResultadoInmune
          ? "Resultado inmune: manejo especial"
          : "Resultado no inmune"}
      </h2>

      <p>
        <strong>Resultado:</strong> {resultadoAnticuerpo.resultado}
      </p>
      <p>
        <strong>Unidad:</strong> {resultadoAnticuerpo.etiquetaComponente}
      </p>

      {esResultadoInmune ? (
        <div className="resultado-inmune-acciones" aria-label="Acciones por resultado inmune">
          <p>
            <strong>Acción requerida:</strong> {resultadoAnticuerpo.indicacion}
          </p>
          <ul>
            <li>Reservar la unidad para un receptor sin el antígeno correspondiente.</li>
            <li>Evitar liberación de componentes hemocomponentes sin manejo especial.</li>
            {resultadoAnticuerpo.advertenciaPlasma && (
              <li>{resultadoAnticuerpo.advertenciaPlasma}</li>
            )}
            {resultadoAnticuerpo.notificacionDonante && (
              <li>{resultadoAnticuerpo.notificacionDonante}</li>
            )}
          </ul>
        </div>
      ) : (
        <p>
          <strong>Indicador:</strong> {resultadoAnticuerpo.indicacion}
        </p>
      )}

      {resultadoAnticuerpo.observacion && (
        <p>
          <strong>Observación:</strong> {resultadoAnticuerpo.observacion}
        </p>
      )}
    </section>
  )}
</main>

);
}