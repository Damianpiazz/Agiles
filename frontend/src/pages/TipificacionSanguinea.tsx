import { useState } from "react";
import type { FormEvent } from "react";
import "../styles/TipificacionSanguinea.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type Tipificacion = {
  id: number;
  donacionId: number;
  grupoABO: "A" | "B" | "AB" | "O";
  factorRhD: "POSITIVO" | "NEGATIVO";
  operador: string;
  fechaHora: string;
};

type Banner = {
  tipo: "ok" | "error";
  texto: string;
} | null;

export default function TipificacionSanguinea() {
  const [donacionId, setDonacionId] = useState("");
  const [grupoABO, setGrupoABO] = useState("");
  const [factorRhD, setFactorRhD] = useState("");
  const [operador, setOperador] = useState("");

  const [historial, setHistorial] = useState<Tipificacion[]>([]);
  const [banner, setBanner] = useState<Banner>(null);

  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [historialConsultado, setHistorialConsultado] = useState(false);

  function obtenerIdDonacion(): number | null {
    const id = Number(donacionId);

    if (!Number.isInteger(id) || id <= 0 || !donacionId.trim()) {
      setBanner({
        tipo: "error",
        texto: "Ingresá un ID de donación válido.",
      });
      return null;
    }

    return id;
  }

  async function consultarHistorial() {
    setBanner(null);
    setHistorial([]);
    setHistorialConsultado(false);

    const id = obtenerIdDonacion();

    if (id === null) return;

    setConsultando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/tipificaciones-sanguineas/donacion/${id}`,
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.error || "No se pudo consultar el historial.",
        );
      }

      setHistorial(datos as Tipificacion[]);
      setHistorialConsultado(true);

      if (datos.length === 0) {
        setBanner({
          tipo: "ok",
          texto: "La donación no tiene tipificaciones registradas.",
        });
      } else {
        setBanner({
          tipo: "ok",
          texto: "Historial consultado correctamente.",
        });
      }
    } catch (error) {
      setBanner({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.",
      });
    } finally {
      setConsultando(false);
    }
  }

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);

    const id = obtenerIdDonacion();

    if (id === null) return;

    if (!grupoABO || !factorRhD) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná el grupo ABO y el factor RhD.",
      });
      return;
    }

    if (!operador.trim()) {
      setBanner({
        tipo: "error",
        texto: "Ingresá el nombre del operador.",
      });
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/tipificaciones-sanguineas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            donacionId: id,
            grupoABO,
            factorRhD,
            operador: operador.trim(),
          }),
        },
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.error || "No se pudo registrar la tipificación.",
        );
      }

      setBanner({
        tipo: "ok",
        texto: `Tipificación #${datos.id} registrada correctamente para la donación #${id}.`,
      });

      setGrupoABO("");
      setFactorRhD("");

      // Actualiza el historial después de guardar.
      const respuestaHistorial = await fetch(
        `${API_URL}/api/tipificaciones-sanguineas/donacion/${id}`,
      );

      if (respuestaHistorial.ok) {
        const datosHistorial = await respuestaHistorial.json();
        setHistorial(datosHistorial as Tipificacion[]);
        setHistorialConsultado(true);
      }
    } catch (error) {
      setBanner({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="tipificacion-container">
      <header className="tipificacion-header">
        <h1>Tipificación sanguínea ABO/RhD</h1>
        <p>
          Registrá el grupo sanguíneo y el factor RhD de una donación
          previamente registrada.
        </p>
      </header>

      {banner && (
        <div
          className={`tipificacion-banner tipificacion-banner-${banner.tipo}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      <section className="tipificacion-card">
        <h2>Datos de la tipificación</h2>

        <form onSubmit={registrar} className="tipificacion-form">
          <div className="tipificacion-field">
            <label htmlFor="tipificacionDonacionId">
              ID de la donación
            </label>
            <input
              id="tipificacionDonacionId"
              type="number"
              min="1"
              step="1"
              value={donacionId}
              onChange={(e) => setDonacionId(e.target.value)}
              placeholder="Ej.: 1"
              required
            />
          </div>

          <div className="tipificacion-field">
            <label htmlFor="grupoABO">Grupo ABO</label>
            <select
              id="grupoABO"
              value={grupoABO}
              onChange={(e) => setGrupoABO(e.target.value)}
              required
            >
              <option value="">Seleccioná un grupo</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>

          <fieldset className="tipificacion-rh">
            <legend>Factor RhD</legend>

            <label>
              <input
                type="radio"
                name="factorRhD"
                value="POSITIVO"
                checked={factorRhD === "POSITIVO"}
                onChange={(e) => setFactorRhD(e.target.value)}
                required
              />
              Positivo (+)
            </label>

            <label>
              <input
                type="radio"
                name="factorRhD"
                value="NEGATIVO"
                checked={factorRhD === "NEGATIVO"}
                onChange={(e) => setFactorRhD(e.target.value)}
              />
              Negativo (-)
            </label>
          </fieldset>

          <div className="tipificacion-field">
            <label htmlFor="tipificacionOperador">Operador</label>
            <input
              id="tipificacionOperador"
              type="text"
              maxLength={120}
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              placeholder="Nombre del operador"
              required
            />
          </div>

          <div className="tipificacion-actions">
            <button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Registrar tipificación"}
            </button>

            <button
              type="button"
              className="tipificacion-button-secondary"
              onClick={consultarHistorial}
              disabled={consultando}
            >
              {consultando ? "Consultando..." : "Consultar historial"}
            </button>
          </div>
        </form>
      </section>

      {historialConsultado && (
        <section className="tipificacion-card tipificacion-historial">
          <h2>Historial de la donación #{donacionId}</h2>

          {historial.length === 0 ? (
            <p>No hay tipificaciones registradas para esta donación.</p>
          ) : (
            <div className="tipificacion-tabla-contenedor">
              <table className="tipificacion-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Grupo ABO</th>
                    <th>Factor RhD</th>
                    <th>Operador</th>
                    <th>Fecha y hora</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.grupoABO}</td>
                      <td>
                        {item.factorRhD === "POSITIVO"
                          ? "Positivo (+)"
                          : "Negativo (-)"}
                      </td>
                      <td>{item.operador}</td>
                      <td>
                        {new Date(item.fechaHora).toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}