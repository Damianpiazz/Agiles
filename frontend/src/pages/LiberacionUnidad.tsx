import { useState } from "react";
import "../styles/LiberacionUnidad.css";

type Evaluacion = {
  donacionId: number;

  donante: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  };

  estadoUnidad: string;

  estudios: {
    tipificacion: {
      grupoABO: string;
      factorRhD: string;
    } | null;

    tamizaje: {
      cargado: boolean;
      pruebasReactivas: string[];
    };

    anticuerposIrregulares: {
      cargado: boolean;
      resultado: string | null;
    };
  };

  discrepancia: {
    detectada: boolean;
    resuelta: boolean;
    pendiente: boolean;
    actual: {
      grupoABO: string;
      factorRhD: string;
    } | null;
    anterior: {
      grupoABO: string;
      factorRhD: string;
    } | null;
    observacion: string | null;
  };

  faltantes: string[];
  motivosBloqueo: string[];
  advertencias: string[];
  puedeLiberarse: boolean;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function LiberacionUnidad() {
  const [donacionId, setDonacionId] = useState("");
  const [usuario, setUsuario] = useState("");
  const [motivo, setMotivo] = useState("");

  const [resolverDiscrepancia, setResolverDiscrepancia] =
    useState(false);

  const [
    observacionDiscrepancia,
    setObservacionDiscrepancia,
  ] = useState("");

  const [evaluacion, setEvaluacion] =
    useState<Evaluacion | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function evaluar() {
    if (!donacionId) {
      setMensaje("Ingresá el ID de la donación.");
      return;
    }

    setMensaje("");
    setCargando(true);

    try {
      const response = await fetch(
        `${API_URL}/api/unidades/${donacionId}/evaluacion`,
      );

      const data = await response.json();

      if (!response.ok) {
        setMensaje(
          data.error ?? "No se pudo evaluar la unidad.",
        );
        setEvaluacion(null);
        return;
      }

      setEvaluacion(data);
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(
    accion: "LIBERAR" | "BLOQUEAR",
  ) {
    if (!usuario.trim()) {
      setMensaje("Ingresá el usuario u operador.");
      return;
    }

    if (accion === "BLOQUEAR" && !motivo.trim()) {
      setMensaje("Ingresá el motivo del bloqueo.");
      return;
    }

    if (
      resolverDiscrepancia &&
      !observacionDiscrepancia.trim()
    ) {
      setMensaje(
        "Documentá cómo se resolvió la discrepancia.",
      );
      return;
    }

    setMensaje("");
    setCargando(true);

    try {
      const response = await fetch(
        `${API_URL}/api/unidades/${donacionId}/estado`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accion,
            usuario,
            motivo:
              accion === "BLOQUEAR"
                ? motivo
                : undefined,
            discrepanciaResuelta:
              resolverDiscrepancia,
            observacionDiscrepancia:
              resolverDiscrepancia
                ? observacionDiscrepancia
                : undefined,
          }),
        },
      );

      const data = await response.json();

      if (data.evaluacion) {
        setEvaluacion(data.evaluacion);
      }

      if (!response.ok) {
        setMensaje(
          data.error ??
            "No se pudo actualizar la unidad.",
        );
        return;
      }

      setMensaje(
        `Unidad ${data.estadoUnidad.toLowerCase()} correctamente.`,
      );

      await evaluar();
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="liberacion">
      <header className="liberacion-header">
        <h1>Liberar / bloquear unidad</h1>
        <p>
          Evaluá los resultados de calificación antes de
          habilitar una unidad para transfusión.
        </p>
      </header>

      <section className="liberacion-card">
        <div className="liberacion-grid">
          <label>
            ID de la donación
            <input
              type="number"
              min="1"
              value={donacionId}
              onChange={(e) =>
                setDonacionId(e.target.value)
              }
            />
          </label>

          <label>
            Usuario / operador
            <input
              value={usuario}
              onChange={(e) =>
                setUsuario(e.target.value)
              }
            />
          </label>
        </div>

        <button
          type="button"
          onClick={evaluar}
          disabled={cargando}
        >
          {cargando ? "Evaluando..." : "Evaluar unidad"}
        </button>
      </section>

      {mensaje && (
        <div className="liberacion-mensaje">
          {mensaje}
        </div>
      )}

      {evaluacion && (
        <section className="liberacion-card">
          <h2>
            {evaluacion.donante.nombre}{" "}
            {evaluacion.donante.apellido}
          </h2>

          <p>DNI: {evaluacion.donante.dni}</p>

          <p>
            <strong>Estado de la unidad:</strong>{" "}
            {evaluacion.estadoUnidad}
          </p>

          <hr />

          <h3>Resultados de calificación</h3>

          <p>
            <strong>ABO/RhD:</strong>{" "}
            {evaluacion.estudios.tipificacion
              ? `${evaluacion.estudios.tipificacion.grupoABO} / ${evaluacion.estudios.tipificacion.factorRhD}`
              : "Pendiente"}
          </p>

          <p>
            <strong>Tamizaje ITT:</strong>{" "}
            {!evaluacion.estudios.tamizaje.cargado
              ? "Pendiente"
              : evaluacion.estudios.tamizaje
                    .pruebasReactivas.length === 0
                ? "No reactivo"
                : `Reactivo: ${evaluacion.estudios.tamizaje.pruebasReactivas.join(", ")}`}
          </p>

          <p>
            <strong>Anticuerpos irregulares:</strong>{" "}
            {evaluacion.estudios.anticuerposIrregulares
              .resultado ?? "Pendiente"}
          </p>

          {evaluacion.faltantes.length > 0 && (
            <div className="liberacion-alerta">
              <strong>Estudios pendientes:</strong>{" "}
              {evaluacion.faltantes.join(", ")}
            </div>
          )}

          {evaluacion.motivosBloqueo.map(
            (motivoBloqueo) => (
              <div
                className="liberacion-alerta"
                key={motivoBloqueo}
              >
                {motivoBloqueo}
              </div>
            ),
          )}

          {evaluacion.advertencias.map((advertencia) => (
            <div
              className="liberacion-advertencia"
              key={advertencia}
            >
              {advertencia}
            </div>
          ))}

          {evaluacion.discrepancia.detectada && (
            <div className="liberacion-discrepancia">
              <strong>
                Se detectó una discrepancia ABO/RhD
              </strong>

              <p>
                Registro anterior:{" "}
                {evaluacion.discrepancia.anterior
                  ? `${evaluacion.discrepancia.anterior.grupoABO} / ${evaluacion.discrepancia.anterior.factorRhD}`
                  : "-"}
              </p>

              <p>
                Registro actual:{" "}
                {evaluacion.discrepancia.actual
                  ? `${evaluacion.discrepancia.actual.grupoABO} / ${evaluacion.discrepancia.actual.factorRhD}`
                  : "-"}
              </p>

              {evaluacion.discrepancia.pendiente && (
                <>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={resolverDiscrepancia}
                      onChange={(e) =>
                        setResolverDiscrepancia(
                          e.target.checked,
                        )
                      }
                    />
                    Discrepancia resuelta
                  </label>

                  {resolverDiscrepancia && (
                    <textarea
                      placeholder="Documentar cómo se resolvió la discrepancia..."
                      value={observacionDiscrepancia}
                      onChange={(e) =>
                        setObservacionDiscrepancia(
                          e.target.value,
                        )
                      }
                    />
                  )}
                </>
              )}
            </div>
          )}

          <label>
            Motivo de bloqueo
            <textarea
              placeholder="Obligatorio sólo para bloqueo manual"
              value={motivo}
              onChange={(e) =>
                setMotivo(e.target.value)
              }
            />
          </label>

          <div className="liberacion-actions">
            <button
              type="button"
              onClick={() =>
                cambiarEstado("LIBERAR")
              }
              disabled={cargando}
            >
              Liberar unidad
            </button>

            <button
              type="button"
              onClick={() =>
                cambiarEstado("BLOQUEAR")
              }
              disabled={cargando}
            >
              Bloquear unidad
            </button>
          </div>
        </section>
      )}
    </main>
  );
}