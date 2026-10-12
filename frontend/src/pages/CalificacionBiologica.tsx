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

export default function CalificacionBiologica() {
const [donacionId, setDonacionId] = useState("");
const [operador, setOperador] = useState("");
const [resultado, setResultado] = useState<Resultado | null>(null);
const [error, setError] = useState("");
const [cargando, setCargando] = useState(false);

async function iniciarCalificacion(
e: React.FormEvent<HTMLFormElement>
) {
e.preventDefault();
setError("");
setResultado(null);

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
</main>

);
}