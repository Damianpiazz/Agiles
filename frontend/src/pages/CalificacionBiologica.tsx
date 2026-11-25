import { useState } from "react";
import { Banner } from "../components/Banner";
import { DonacionesTable } from "../components/DonacionesTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useDonaciones } from "../hooks/useDatos";
import type { DonacionResumen } from "../types/donacion";
import "../styles/CalificacionBiologica.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
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
const {
  datos: donaciones,
  cargando: cargandoLista,
  error: errorLista,
} = useDonaciones();
const [seleccionada, setSeleccionada] = useState<DonacionResumen | null>(null);
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

if (!seleccionada) {
  setError("Seleccioná una donación de la tabla antes de iniciar la calificación.");
  document.getElementById("donacionesCalificacion")?.scrollIntoView({ behavior: "smooth" });
  return;
}

if (!operador.trim()) {
  setError("Ingresá el nombre del operador.");
  document.getElementById("operador")?.focus();
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
        donacionId: seleccionada.id,
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

  if (!seleccionada) {
    setError("Seleccioná una donación antes de registrar el resultado.");
    return;
  }

  const id = seleccionada.id;

  if (!operador.trim()) {
    setError("Ingresá el nombre del operador antes de registrar el resultado.");
    document.getElementById("operador")?.focus();
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

function seleccionar(donacion: DonacionResumen) {
  setSeleccionada(donacion);
  setResultado(null);
  setResultadoAnticuerpo(null);
  setError("");
}

return (
<div className="calificacion-container">
  <PageHeader
    title="Calificación biológica"
    description="Elegí una donación de la tabla para iniciar su calificación y registrar el resultado inmune."
  />

  {error && <Banner tone="error">{error}</Banner>}

  <section id="donacionesCalificacion" className="calificacion-tabla" aria-labelledby="donacionesCalificacionTitulo">
    <h2 id="donacionesCalificacionTitulo">Donaciones registradas</h2>
    <DonacionesTable
      rows={donaciones}
      loading={cargandoLista}
      error={errorLista}
      selectedId={seleccionada?.id ?? null}
      onSeleccionar={seleccionar}
      actionLabel="Calificar"
    />
  </section>

  <section className="calificacion-seleccion" aria-live="polite">
    <h2>Donación seleccionada</h2>
    {seleccionada ? (
      <p>
        <strong>Donación #{seleccionada.id}</strong> · {seleccionada.donante.apellido},{" "}
        {seleccionada.donante.nombre} (DNI {seleccionada.donante.dni}) ·{" "}
        {new Date(seleccionada.fechaHora).toLocaleString("es-AR")}
      </p>
    ) : (
      <p>Seleccioná una donación de la tabla para continuar.</p>
    )}
  </section>

  <form
    onSubmit={iniciarCalificacion}
    className="calificacion-form"
  >
    <FormGrid columns={2}>
      <FormField id="operador" label="Operador" required>
        <input
          id="operador"
          type="text"
          maxLength={120}
          value={operador}
          onChange={(e) => setOperador(e.target.value)}
          placeholder="Nombre del operador"
          required
        />
      </FormField>
    </FormGrid>

    <button type="submit" disabled={cargando}>
      {cargando ? "Procesando..." : "Iniciar calificación"}
    </button>
  </form>

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
        <StatusBadge
          estado={resultado.calificacion.estado}
          etiqueta={resultado.calificacion.estado}
        />
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
      <FormSection
        title="Resultado inmune / detección de anticuerpos irregulares"
        description="Registrar la respuesta del estudio inmunohematológico para decidir manejo especial previo a la liberación."
      >
        <FormGrid columns={2}>
          <FormField id="resultadoIrregular" label="Resultado">
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
          </FormField>

          <FormField id="observacionAnticuerpo" label="Observación operatoria" optional>
            <textarea
              id="observacionAnticuerpo"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ej.: unidad con reacción inmune; requiere manejo especial antes de la liberación."
            />
          </FormField>
        </FormGrid>

        <button type="submit" disabled={cargando}>
          {cargando ? "Procesando..." : "Guardar resultado"}
        </button>
      </FormSection>
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
        <strong>Resultado:</strong>{" "}
        <StatusBadge
          estado={resultadoAnticuerpo.resultado}
          etiqueta={resultadoAnticuerpo.resultado}
        />
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
</div>

);
}