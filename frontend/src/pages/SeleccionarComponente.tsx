import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "../styles/SeleccionarComponente.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type GrupoABO = "A" | "B" | "AB" | "O";
type FactorRhD = "POSITIVO" | "NEGATIVO";

type Solicitud = {
  id: number;
  dniPaciente: string;
  nombrePaciente: string;
  grupoABO: GrupoABO;
  factorRhD: FactorRhD;
  tipoHemocomponente: string;
  cantidad: number;
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";
  observaciones?: string | null;
  operador: string;
  fechaHora: string;
};

type Unidad = {
  id: number;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABO: GrupoABO;
  factorRhD: FactorRhD;
  fechaVencimiento: string;
  estado: string;
  vencida: boolean;
  reservadaPor?: string | null;
  reservadaEn?: string | null;
};

type Banner = {
  tipo: "ok" | "error" | "aviso";
  texto: string;
} | null;

const etiquetasHemocomponente: Record<string, string> = {
  GLOBULOS_ROJOS: "Glóbulos rojos",
  PLASMA: "Plasma",
  PLAQUETAS: "Plaquetas",
  CRIOPRECIPITADO: "Crioprecipitado",
};

const etiquetasEstado: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  BLOQUEADA: "Bloqueada",
  VENCIDA: "Vencida",
  DADA_DE_BAJA: "Dada de baja",
};

function etiquetaReceptor(solicitud: Solicitud): string {
  const factor = solicitud.factorRhD === "POSITIVO" ? "+" : "-";
  return `${solicitud.grupoABO}${factor}`;
}

export default function SeleccionarComponente() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [solicitudId, setSolicitudId] = useState("");
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [preparadas, setPreparadas] = useState<Unidad[]>([]);
  const [mensajePreparadas, setMensajePreparadas] = useState("");
  const [mensajeServidor, setMensajeServidor] = useState("");
  const [sinUnidades, setSinUnidades] = useState(false);
  const [operador, setOperador] = useState("");

  const [banner, setBanner] = useState<Banner>(null);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [preparandoId, setPreparandoId] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarSolicitudes() {
      try {
        const respuesta = await fetch(
          `${API_URL}/api/solicitudes-transfusiones?estado=APROBADA`,
        );
        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(
            datos?.error || "No se pudieron consultar las solicitudes.",
          );
        }

        if (cancelado) return;

        setSolicitudes(datos as Solicitud[]);

        if ((datos as Solicitud[]).length === 0) {
          setBanner({
            tipo: "aviso",
            texto: "No hay solicitudes de transfusión aprobadas para preparar componentes.",
          });
        }
      } catch (error) {
        if (cancelado) return;

        setBanner({
          tipo: "error",
          texto:
            error instanceof Error
              ? error.message
              : "No se pudo conectar con el servidor.",
        });
      } finally {
        if (!cancelado) setCargandoSolicitudes(false);
      }
    }

    cargarSolicitudes();

    return () => {
      cancelado = true;
    };
  }, []);

  async function consultarUnidades(idSolicitud: string) {
    setBanner(null);
    setUnidades([]);
    setMensajeServidor("");
    setSinUnidades(false);

    if (!idSolicitud) {
      setPreparadas([]);
      setMensajePreparadas("");
      return;
    }

    setConsultando(true);

    try {
      const [respuesta, respuestaPreparadas] = await Promise.all([
        fetch(
          `${API_URL}/api/solicitudes-transfusiones/${idSolicitud}/unidades-compatibles`,
        ),
        fetch(
          `${API_URL}/api/solicitudes-transfusiones/${idSolicitud}/unidades-reservadas`,
        ),
      ]);

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudieron consultar las unidades.");
      }

      setUnidades(datos.unidades as Unidad[]);
      setMensajeServidor(datos.mensaje as string);
      setSinUnidades(Boolean(datos.sinUnidadesDisponibles));

      if (datos.sinUnidadesDisponibles) {
        setBanner({ tipo: "aviso", texto: datos.mensaje as string });
      } else {
        setBanner({ tipo: "ok", texto: datos.mensaje as string });
      }

      const datosPreparadas = await respuestaPreparadas.json().catch(() => null);

      if (respuestaPreparadas.ok && datosPreparadas) {
        setPreparadas(datosPreparadas.unidades as Unidad[]);
        setMensajePreparadas(datosPreparadas.mensaje as string);
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

  function seleccionarSolicitud(evento: ChangeEvent<HTMLSelectElement>) {
    const valor = evento.target.value;
    setSolicitudId(valor);
    void consultarUnidades(valor);
  }

  async function preparar(unidad: Unidad, evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBanner(null);

    if (!solicitudId) return;

    if (!operador.trim()) {
      setBanner({
        tipo: "error",
        texto: "Ingresá el nombre del operador para confirmar la preparación.",
      });
      return;
    }

    setPreparandoId(unidad.id);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/solicitudes-transfusiones/${solicitudId}/unidades/${unidad.id}/reservar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operador: operador.trim() }),
        },
      );
      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo preparar la unidad.");
      }

      setBanner({ tipo: "ok", texto: datos.mensaje as string });
      await consultarUnidades(solicitudId);
      setBanner({ tipo: "ok", texto: datos.mensaje as string });
    } catch (error) {
      setBanner({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.",
      });
    } finally {
      setPreparandoId(null);
    }
  }

  const solicitudActual = solicitudes.find(
    (solicitud) => String(solicitud.id) === solicitudId,
  );

  return (
    <main className="seleccion-container">
      <header className="seleccion-header">
        <h1>Seleccionar y preparar componente</h1>
        <p>
          Seleccioná una solicitud de transfusión aprobada para listar las
          unidades compatibles y confirmar la preparación de la unidad elegida.
        </p>
      </header>

      {banner && (
        <div
          className={`seleccion-banner seleccion-banner-${banner.tipo}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      <section className="seleccion-card">
        <h2>Solicitud de transfusión</h2>

        <div className="seleccion-field">
          <label htmlFor="seleccionSolicitud">Solicitud aprobada</label>
          <select
            id="seleccionSolicitud"
            value={solicitudId}
            onChange={seleccionarSolicitud}
            disabled={cargandoSolicitudes || solicitudes.length === 0}
          >
            <option value="">
              {cargandoSolicitudes
                ? "Cargando solicitudes..."
                : "Seleccioná una solicitud"}
            </option>
            {solicitudes.map((solicitud) => (
              <option key={solicitud.id} value={solicitud.id}>
                #{solicitud.id} – {solicitud.nombrePaciente} (DNI{" "}
                {solicitud.dniPaciente}) – {etiquetaReceptor(solicitud)} –{" "}
                {etiquetasHemocomponente[solicitud.tipoHemocomponente] ??
                  solicitud.tipoHemocomponente}
              </option>
            ))}
          </select>
        </div>

        {solicitudActual && (
          <dl className="seleccion-resumen">
            <div>
              <dt>Paciente</dt>
              <dd>
                {solicitudActual.nombrePaciente} (DNI {solicitudActual.dniPaciente})
              </dd>
            </div>
            <div>
              <dt>Receptor</dt>
              <dd>
                {etiquetaReceptor(solicitudActual)} ·{" "}
                {etiquetasHemocomponente[solicitudActual.tipoHemocomponente] ??
                  solicitudActual.tipoHemocomponente}
              </dd>
            </div>
            <div>
              <dt>Cantidad requerida</dt>
              <dd>{solicitudActual.cantidad}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>Aprobada</dd>
            </div>
          </dl>
        )}
      </section>

      {solicitudId && (
        <section className="seleccion-card">
          <h2>Unidades compatibles</h2>

          {consultando && <p>Consultando unidades...</p>}

          {!consultando && sinUnidades && (
            <p className="seleccion-vacio">{mensajeServidor}</p>
          )}

          {!consultando && unidades.length > 0 && (
            <>
              <form
                className="seleccion-operador"
                onSubmit={(evento) => evento.preventDefault()}
              >
                <div className="seleccion-field">
                  <label htmlFor="seleccionOperador">Operador</label>
                  <input
                    id="seleccionOperador"
                    type="text"
                    maxLength={120}
                    value={operador}
                    onChange={(evento) => setOperador(evento.target.value)}
                    placeholder="Nombre del operador que confirma"
                  />
                </div>
                <p className="seleccion-ayuda">
                  Confirmá la preparación de una unidad para reservarla para el
                  paciente de la solicitud.
                </p>
              </form>

              <div className="seleccion-tabla-contenedor">
                <table className="seleccion-tabla">
                  <thead>
                    <tr>
                      <th>Unidad</th>
                      <th>Grupo</th>
                      <th>Factor</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidades.map((unidad) => (
                      <tr key={unidad.id}>
                        <td>{unidad.numeroUnidad}</td>
                        <td>{unidad.grupoABO}</td>
                        <td>
                          {unidad.factorRhD === "POSITIVO"
                            ? "Positivo (+)"
                            : "Negativo (-)"}
                        </td>
                        <td>
                          {new Date(unidad.fechaVencimiento).toLocaleDateString(
                            "es-AR",
                          )}
                        </td>
                        <td>
                          {etiquetasEstado[unidad.estado] ?? unidad.estado}
                        </td>
                        <td>
                          <form
                            className="seleccion-accion"
                            onSubmit={(evento) => preparar(unidad, evento)}
                          >
                            <button
                              type="submit"
                              disabled={preparandoId !== null || !operador.trim()}
                            >
                              {preparandoId === unidad.id
                                ? "Preparando..."
                                : "Preparar"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {solicitudId && (
        <section className="seleccion-card">
          <h2>Unidades preparadas para la solicitud</h2>

          {preparadas.length === 0 ? (
            <p className="seleccion-nota">
              {mensajePreparadas ||
                "Todavía no hay unidades preparadas para esta solicitud."}
            </p>
          ) : (
            <>
              <p className="seleccion-nota">
                {mensajePreparadas} Se mantienen en esta pantalla hasta que la
                solicitud cambie de estado.
              </p>

              <div className="seleccion-tabla-contenedor">
                <table className="seleccion-tabla">
                  <thead>
                    <tr>
                      <th>Unidad</th>
                      <th>Grupo</th>
                      <th>Factor</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Reservada por</th>
                      <th>Fecha de reserva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparadas.map((unidad) => (
                      <tr key={unidad.id}>
                        <td>{unidad.numeroUnidad}</td>
                        <td>{unidad.grupoABO}</td>
                        <td>
                          {unidad.factorRhD === "POSITIVO"
                            ? "Positivo (+)"
                            : "Negativo (-)"}
                        </td>
                        <td>
                          {new Date(unidad.fechaVencimiento).toLocaleDateString(
                            "es-AR",
                          )}
                        </td>
                        <td>
                          <span className="seleccion-estado-preparada">
                            {etiquetasEstado[unidad.estado] ?? unidad.estado}
                          </span>
                        </td>
                        <td>{unidad.reservadaPor ?? "—"}</td>
                        <td>
                          {unidad.reservadaEn
                            ? new Date(unidad.reservadaEn).toLocaleString(
                                "es-AR",
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
