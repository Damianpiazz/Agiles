import { useState } from "react";
import type { FormEvent } from "react";
import {
  buscarDonanteSchema,
  type BuscarDonanteForm,
} from "../schemas/buscarDonante";
import { PREGUNTAS_CUESTIONARIO } from "../schemas/entrevista";
import type { Donante } from "../types/donante";
import "../styles/BuscarDonante.css";

type Props = {
  onRegistrarDonacion?: (donante: Donante) => void;
};

type EntrevistaDonacion = {
  id: number;
  resultadoAdmision: "ADMITIDO" | "DIFERIDO";
  tipoDiferimiento: "TEMPORAL" | "PERMANENTE" | null;
  causaDiferimiento: string | null;
  entrevistador: string | null;
  respuestas: Record<string, boolean>;
  createdAt: string;
};

type AnticuerpoIrregularHistorial = {
  id: number;
  resultado: "POSITIVO" | "NEGATIVO";
  operador: string;
  fechaHora: string;
  observacion: string | null;
  createdAt: string;
  updatedAt: string;
};

type DonacionHistorial = {
  id: number;
  fechaHora: string;
  estado: "REGISTRADA" | "EN_CALIFICACION" | "CALIFICADA" | "RECHAZADA";
  operador: string;
  peso: string | null;
  tensionArterial: string | null;
  hemoglobina: string | null;
  voluntario: boolean;
  reposicion: boolean;
  autoExcluido: boolean;
  observaciones: string | null;
  entrevista: EntrevistaDonacion | null;
  anticuerpoIrregular: AnticuerpoIrregularHistorial | null;
};

type DonanteDetalle = Donante & { donaciones?: DonacionHistorial[] };

const formInicial: BuscarDonanteForm = {
  dni: "",
  nombre: "",
  apellido: "",
};

export default function BuscarDonante({ onRegistrarDonacion }: Props) {
  const [form, setForm] = useState<BuscarDonanteForm>(formInicial);
  const [resultados, setResultados] = useState<DonanteDetalle[]>([]);
  const [seleccionado, setSeleccionado] = useState<DonanteDetalle | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [buscando, setBuscando] = useState(false);

  function formatearFecha(fecha: string) {
    const [anio, mes, dia] = fecha.slice(0, 10).split("-");
    return `${dia}/${mes}/${anio}`;
  }

  function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(fecha));
  }

  function estadoDonacion(estado: DonacionHistorial["estado"]) {
    const etiquetas: Record<DonacionHistorial["estado"], string> = {
      REGISTRADA: "Registrada",
      EN_CALIFICACION: "En calificación",
      CALIFICADA: "Calificada",
      RECHAZADA: "Rechazada / bloqueada",
    };
    return etiquetas[estado];
  }

  async function buscar(e: FormEvent) {
    e.preventDefault();

    setMensaje("");
    setSeleccionado(null);

    const parsed = buscarDonanteSchema.safeParse(form);

    if (!parsed.success) {
      setMensaje(parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.");
      return;
    }

    const params = new URLSearchParams();

    if (parsed.data.dni) {
      params.set("dni", parsed.data.dni);
    } else {
      params.set("nombre", parsed.data.nombre);
      params.set("apellido", parsed.data.apellido);
    }

    setBuscando(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes?${params.toString()}`,
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResultados([]);
        setMensaje(data?.error ?? "No se pudo realizar la búsqueda.");
        return;
      }

      setResultados(data);

      if (data.length === 0) {
        setMensaje("No se encontraron resultados.");
      }
    } catch {
      setResultados([]);
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setBuscando(false);
    }
  }

  async function verDetalle(id: number) {
    setMensaje("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes/${id}`,
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMensaje(data?.error ?? "No se pudo consultar el donante.");
        return;
      }

      setSeleccionado(data);
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    }
  }

  return (
    <main className="consulta">
      <header className="consulta-header">
        <h1>Buscar donante</h1>
        <p>
          Buscá un donante por DNI o por nombre y apellido.
        </p>
      </header>

      <form onSubmit={buscar} noValidate>
        <fieldset>
          <legend>Criterios de búsqueda</legend>

          <div className="consulta-grid">
            <div className="consulta-field">
              <label htmlFor="dniBusqueda">DNI</label>
              <input
                id="dniBusqueda"
                value={form.dni}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    dni: e.target.value,
                  }))
                }
              />
            </div>

            <div className="consulta-separador">o</div>

            <div className="consulta-field">
              <label htmlFor="nombreBusqueda">Nombre</label>
              <input
                id="nombreBusqueda"
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
              />
            </div>

            <div className="consulta-field">
              <label htmlFor="apellidoBusqueda">Apellido</label>
              <input
                id="apellidoBusqueda"
                value={form.apellido}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    apellido: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </fieldset>

        <div className="consulta-actions">
          <button type="submit" disabled={buscando}>
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      {mensaje && (
        <div className="consulta-banner" role="status">
          {mensaje}
        </div>
      )}

      {resultados.length > 0 && (
        <section className="consulta-resultados">
          <h2>Resultados</h2>

          {resultados.map((donante) => (
            <div className="consulta-resultado" key={donante.id}>
              <div>
                <strong>
                  {donante.nombre} {donante.apellido}
                </strong>
                <p>DNI: {donante.dni}</p>
              </div>

              <div className="consulta-resultado-acciones">
                <button
                  type="button"
                  onClick={() => verDetalle(donante.id)}
                >
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {seleccionado && (
        <section className="consulta-detalle">
          <h2>Datos del donante</h2>

          {onRegistrarDonacion && (
            <div className="consulta-actions">
              <button
                type="button"
                onClick={() => onRegistrarDonacion(seleccionado)}
              >
                Registrar donación
              </button>
            </div>
          )}

          <fieldset>
            <legend>Datos filiatorios</legend>

            <div className="consulta-datos">
              <p><strong>Nombre:</strong> {seleccionado.nombre}</p>
              <p><strong>Apellido:</strong> {seleccionado.apellido}</p>
              <p><strong>DNI:</strong> {seleccionado.dni}</p>
              <p>
                <strong>Fecha de nacimiento:</strong>{" "}
                {formatearFecha(seleccionado.fechaNacimiento)}
              </p>
              <p>
                <strong>Lugar de nacimiento:</strong>{" "}
                {seleccionado.lugarNacimiento}
              </p>
              <p>
                <strong>Sexo biológico:</strong>{" "}
                {seleccionado.sexoBiologico === "MASCULINO"
                  ? "Masculino"
                  : "Femenino"}
              </p>
            </div>
          </fieldset>

          <fieldset>
            <legend>Domicilio y contacto</legend>

            <div className="consulta-datos">
              <p><strong>Domicilio:</strong> {seleccionado.domicilio}</p>
              <p>
                <strong>Código postal:</strong>{" "}
                {seleccionado.codigoPostal}
              </p>
              <p><strong>Email:</strong> {seleccionado.email}</p>
              <p>
                <strong>Teléfono fijo:</strong>{" "}
                {seleccionado.telefonoFijo || "No registrado"}
              </p>
              <p>
                <strong>Teléfono celular:</strong>{" "}
                {seleccionado.telefonoCelular}
              </p>
            </div>
          </fieldset>

          <fieldset>
            <legend>Historial de donaciones</legend>
            {seleccionado.donaciones?.length ? (
              <div className="consulta-donaciones">
                {seleccionado.donaciones.map((donacion) => (
                  <article className="consulta-donacion" key={donacion.id}>
                    <div className="consulta-donacion-header">
                      <h3>Donación #{donacion.id}</h3>
                      <span className={`consulta-estado consulta-estado-${donacion.estado.toLowerCase()}`}>
                        {estadoDonacion(donacion.estado)}
                      </span>
                    </div>
                    <div className="consulta-datos">
                      <p>
                        <strong>Fecha:</strong> {formatearFechaHora(donacion.fechaHora)}
                      </p>
                      <p><strong>Operador:</strong> {donacion.operador}</p>
                      <p><strong>Peso:</strong> {donacion.peso || "No registrado"}</p>
                      <p><strong>Tensión arterial:</strong> {donacion.tensionArterial || "No registrada"}</p>
                      <p><strong>Hemoglobina:</strong> {donacion.hemoglobina || "No registrada"}</p>
                      <p>
                        <strong>Modalidad:</strong>{" "}
                        {donacion.voluntario ? "Voluntaria" : donacion.reposicion ? "Reposición" : "No especificada"}
                      </p>
                      {donacion.autoExcluido && (
                        <p><strong>Autoexclusión:</strong> Sí</p>
                      )}
                      {donacion.observaciones && (
                        <p><strong>Observaciones:</strong> {donacion.observaciones}</p>
                      )}
                    </div>
                    {donacion.anticuerpoIrregular ? (
                      <div className="consulta-anticuerpo-donacion">
                        <h4>Resultado inmune / anticuerpos irregulares</h4>
                        <div className="consulta-datos">
                          <p>
                            <strong>Resultado:</strong>{" "}
                            {donacion.anticuerpoIrregular.resultado === "POSITIVO"
                              ? "Positivo"
                              : "Negativo"}
                          </p>
                          <p>
                            <strong>Operador:</strong>{" "}
                            {donacion.anticuerpoIrregular.operador}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{" "}
                            {formatearFechaHora(donacion.anticuerpoIrregular.fechaHora)}
                          </p>
                          {donacion.anticuerpoIrregular.observacion && (
                            <p>
                              <strong>Observación:</strong>{" "}
                              {donacion.anticuerpoIrregular.observacion}
                            </p>
                          )}
                          {donacion.anticuerpoIrregular.resultado === "POSITIVO" && (
                            <p>
                              <strong>Acción:</strong> Reservar para receptor sin el antígeno correspondiente o desplasmatizar completamente. No se recomienda utilizar componentes plasmáticos derivados.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="consulta-sin-anticuerpo">
                        Sin registro de anticuerpos irregulares.
                      </p>
                    )}

                    {donacion.entrevista ? (
                      <details className="consulta-entrevista-donacion">
                        <summary>Ver entrevista pre-donación</summary>
                        <div className="consulta-entrevista-contenido">
                          <div className="consulta-datos">
                            <p>
                              <strong>Resultado:</strong>{" "}
                              {donacion.entrevista.resultadoAdmision === "ADMITIDO"
                                ? "Admitido"
                                : "Diferido"}
                            </p>
                            <p>
                              <strong>Personal entrevistador:</strong>{" "}
                              {donacion.entrevista.entrevistador || "No registrado"}
                            </p>
                            <p>
                              <strong>Fecha:</strong>{" "}
                              {formatearFechaHora(donacion.entrevista.createdAt)}
                            </p>
                            {donacion.entrevista.resultadoAdmision === "DIFERIDO" && (
                              <>
                                <p>
                                  <strong>Tipo de diferimiento:</strong>{" "}
                                  {donacion.entrevista.tipoDiferimiento || "No registrado"}
                                </p>
                                <p>
                                  <strong>Causa:</strong>{" "}
                                  {donacion.entrevista.causaDiferimiento || "No registrada"}
                                </p>
                              </>
                            )}
                          </div>
                          <h4>Respuestas del cuestionario</h4>
                          <ul className="consulta-respuestas-entrevista">
                            {Object.entries(donacion.entrevista.respuestas).map(
                              ([clave, respuesta]) => (
                                <li key={clave}>
                                  <strong>
                                    {PREGUNTAS_CUESTIONARIO.find(
                                      (pregunta) => pregunta.clave === clave,
                                    )?.texto ?? clave}
                                  </strong>
                                  <span>{respuesta ? "Sí" : "No"}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </details>
                    ) : (
                      <p className="consulta-sin-entrevista">
                        Esta donación no tiene una entrevista asociada.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p>No hay donaciones registradas para este donante.</p>
            )}
          </fieldset>

        </section>
      )}
    </main>
  );
}