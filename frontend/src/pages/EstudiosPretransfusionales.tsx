
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "../styles/EstudiosPretransfusionales.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type TipoEstudio =
  | "TIPIFICACION_ABO_RHD"
  | "DETECCION_ANTICUERPOS"
  | "PRUEBA_CRUZADA";

type Compatibilidad = "COMPATIBLE" | "INCOMPATIBLE";

type Solicitud = {
  id: number;
  pacienteId: number | null;
  nombrePaciente: string;
  dniPaciente: string;
  tipoHemocomponente: string;
  grupoABO: string;
  factorRhD: string;
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";
};

type Unidad = {
  id: number;
  numeroUnidad: string;
  tipoHemocomponente: string;
  estado: string;
  solicitudId: number | null;
};

type Estudio = {
  id: number;
  solicitudId: number;
  tipo: TipoEstudio;
  resultado: string;
  compatibilidad: Compatibilidad | null;
  observaciones: string | null;
  operador: string;
  fechaHora: string;
  unidadSangre: {
    id: number;
    numeroUnidad: string;
  } | null;
  alerta: string | null;
};

type Historial = {
  solicitudId: number;
  pacienteId: number;
  estudios: Estudio[];
};

type Formulario = {
  tipo: TipoEstudio | "";
  resultado: string;
  unidadSangreId: string;
  compatibilidad: Compatibilidad | "";
  observaciones: string;
  operador: string;
};

type Banner = {
  tipo: "ok" | "error" | "alerta";
  texto: string;
} | null;

const formularioInicial: Formulario = {
  tipo: "",
  resultado: "",
  unidadSangreId: "",
  compatibilidad: "",
  observaciones: "",
  operador: "",
};

const ETIQUETAS: Record<TipoEstudio, string> = {
  TIPIFICACION_ABO_RHD: "Tipificación ABO/RhD",
  DETECCION_ANTICUERPOS: "Detección de anticuerpos",
  PRUEBA_CRUZADA: "Prueba cruzada",
};

function fechaArgentina(valor: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(valor));
}

export default function EstudiosPretransfusionales() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [solicitudId, setSolicitudId] = useState("");
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [form, setForm] = useState<Formulario>(formularioInicial);

  const [banner, setBanner] = useState<Banner>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const solicitudSeleccionada = solicitudes.find(
    (solicitud) => String(solicitud.id) === solicitudId,
  );

  const solicitudesActivas = solicitudes.filter(
    (solicitud) =>
      solicitud.estado !== "CANCELADA" &&
      solicitud.pacienteId !== null,
  );

  const unidadesElegibles = unidades.filter(
    (unidad) =>
      unidad.tipoHemocomponente ===
        solicitudSeleccionada?.tipoHemocomponente &&
      (unidad.estado === "DISPONIBLE" ||
        unidad.estado === "RESERVADA") &&
      (unidad.solicitudId === null ||
        unidad.solicitudId === solicitudSeleccionada?.id),
  );

  // Cargar solicitudes e inventario.
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const [resSolicitudes, resUnidades] = await Promise.all([
          fetch(`${API_URL}/api/solicitudes-transfusiones`),
          fetch(`${API_URL}/api/inventario-unidades`),
        ]);

        if (!resSolicitudes.ok || !resUnidades.ok) {
          throw new Error("No se pudieron cargar los datos");
        }

        const datosSolicitudes =
          (await resSolicitudes.json()) as Solicitud[];

        const datosUnidades =
          (await resUnidades.json()) as Unidad[];

        if (activo) {
          setSolicitudes(datosSolicitudes);
          setUnidades(datosUnidades);
        }
      } catch {
        if (activo) {
          setBanner({
            tipo: "error",
            texto: "No se pudieron cargar las solicitudes o el inventario.",
          });
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargarDatos();

    return () => {
      activo = false;
    };
  }, []);

  // Cargar historial cuando cambia la solicitud.
  useEffect(() => {
    if (!solicitudId) {
      setEstudios([]);
      return;
    }

    let activo = true;
    setCargandoHistorial(true);
    setEstudios([]);

    async function cargarHistorial() {
      try {
        const res = await fetch(
          `${API_URL}/api/solicitudes-transfusiones/${solicitudId}/estudios-pretransfusionales`,
        );

        if (!res.ok) {
          throw new Error("No se pudo obtener el historial");
        }

        const datos = (await res.json()) as Historial;

        if (activo) setEstudios(datos.estudios);
      } catch {
        if (activo) {
          setBanner({
            tipo: "error",
            texto: "No se pudo cargar el historial de estudios.",
          });
        }
      } finally {
        if (activo) setCargandoHistorial(false);
      }
    }

    void cargarHistorial();

    return () => {
      activo = false;
    };
  }, [solicitudId]);

  function cambiarSolicitud(id: string) {
    setSolicitudId(id);
    setBanner(null);
    setForm((actual) => ({
      ...formularioInicial,
      operador: actual.operador,
    }));
  }

  async function guardarEstudio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBanner(null);

    if (!solicitudSeleccionada) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná una solicitud de transfusión.",
      });
      return;
    }

    if (!form.tipo || !form.resultado.trim() || !form.operador.trim()) {
      setBanner({
        tipo: "error",
        texto: "Completá el tipo de estudio, resultado y operador.",
      });
      return;
    }

    if (
      form.tipo === "PRUEBA_CRUZADA" &&
      (!form.unidadSangreId || !form.compatibilidad)
    ) {
      setBanner({
        tipo: "error",
        texto: "La prueba cruzada requiere una unidad y su compatibilidad.",
      });
      return;
    }

    const datos = {
      tipo: form.tipo,
      resultado: form.resultado.trim(),
      operador: form.operador.trim(),
      observaciones: form.observaciones.trim(),
      ...(form.tipo === "PRUEBA_CRUZADA"
        ? {
            unidadSangreId: Number(form.unidadSangreId),
            compatibilidad: form.compatibilidad,
          }
        : {}),
    };

    setEnviando(true);

    try {
      const res = await fetch(
        `${API_URL}/api/solicitudes-transfusiones/${solicitudId}/estudios-pretransfusionales`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        },
      );

      const respuesta = (await res.json()) as {
        error?: string;
        campos?: Record<string, string[]>;
        alerta?: string | null;
      };

      if (!res.ok) {
        const erroresCampos = Object.entries(
          respuesta.campos ?? {},
        ).flatMap(([campo, mensajes]) =>
          mensajes.map((mensaje) => `${campo}: ${mensaje}`),
        );

        setBanner({
          tipo: "error",
          texto:
            erroresCampos.join(" · ") ||
            respuesta.error ||
            "No se pudo registrar el estudio.",
        });
        return;
      }

      setForm((actual) => ({
        ...formularioInicial,
        operador: actual.operador,
      }));

      // Volver a consultar los registros guardados en PostgreSQL.
      let historialActualizado = true;

      try {
        const historialRes = await fetch(
          `${API_URL}/api/solicitudes-transfusiones/${solicitudId}/estudios-pretransfusionales`,
        );

        if (!historialRes.ok) {
          throw new Error("No se pudo actualizar el historial");
        }

        const historial =
          (await historialRes.json()) as Historial;

        setEstudios(historial.estudios);
      } catch {
        historialActualizado = false;
      }

      const texto = respuesta.alerta
        ? respuesta.alerta
        : "Estudio pretransfusional registrado correctamente.";

      setBanner({
        tipo: respuesta.alerta ? "alerta" : "ok",
        texto: historialActualizado
          ? texto
          : `${texto} No se pudo actualizar el historial; recargá la pantalla.`,
      });
    } catch {
      setBanner({
        tipo: "error",
        texto: "No se pudo conectar con el backend.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="pretrans">
      <header className="pretrans-header">
        <h1>Estudios pretransfusionales</h1>
        <p>
          Registrá resultados, evaluá pruebas de compatibilidad
          y consultá su trazabilidad.
        </p>
      </header>

      {banner && (
        <div
          className={`pretrans-banner pretrans-${banner.tipo}`}
          role={banner.tipo === "alerta" ? "alert" : "status"}
        >
          {banner.texto}
        </div>
      )}

      <section className="pretrans-panel">
        <h2>1. Seleccionar solicitud</h2>

        {cargando ? (
          <p>Cargando solicitudes...</p>
        ) : (
          <div className="pretrans-campo">
            <label htmlFor="pretrans-solicitud">
              Solicitud de transfusión
            </label>

            <select
              id="pretrans-solicitud"
              value={solicitudId}
              onChange={(e) => cambiarSolicitud(e.target.value)}
              disabled={enviando}
            >
              <option value="">Seleccioná una solicitud</option>

              {solicitudesActivas.map((solicitud) => (
                <option key={solicitud.id} value={solicitud.id}>
                  #{solicitud.id} - {solicitud.nombrePaciente}
                  {" - DNI "}
                  {solicitud.dniPaciente}
                </option>
              ))}
            </select>

            {solicitudesActivas.length === 0 && (
              <p className="pretrans-ayuda">
                No hay solicitudes activas con paciente asociado.
              </p>
            )}
          </div>
        )}

        {solicitudSeleccionada && (
          <div className="pretrans-resumen">
            <strong>
              Solicitud #{solicitudSeleccionada.id}
            </strong>
            <span>
              Paciente: {solicitudSeleccionada.nombrePaciente}
              {" · DNI "}
              {solicitudSeleccionada.dniPaciente}
            </span>
            <span>
              Grupo: {solicitudSeleccionada.grupoABO}
              {solicitudSeleccionada.factorRhD === "POSITIVO"
                ? "+"
                : "-"}
              {" · Estado: "}
              {solicitudSeleccionada.estado}
            </span>
          </div>
        )}
      </section>

      {solicitudSeleccionada && (
        <>
          <section className="pretrans-panel">
            <h2>2. Registrar estudio</h2>

            <form onSubmit={guardarEstudio}>
              <div className="pretrans-grid">
                <div className="pretrans-campo">
                  <label htmlFor="pretrans-tipo">
                    Tipo de estudio *
                  </label>

                  <select
                    id="pretrans-tipo"
                    required
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipo: e.target.value as TipoEstudio | "",
                        unidadSangreId: "",
                        compatibilidad: "",
                      })
                    }
                  >
                    <option value="">Seleccioná un estudio</option>
                    <option value="TIPIFICACION_ABO_RHD">
                      Tipificación ABO/RhD
                    </option>
                    <option value="DETECCION_ANTICUERPOS">
                      Detección de anticuerpos
                    </option>
                    <option value="PRUEBA_CRUZADA">
                      Prueba cruzada
                    </option>
                  </select>
                </div>

                <div className="pretrans-campo">
                  <label htmlFor="pretrans-resultado">
                    Resultado del estudio *
                  </label>

                  <input
                    id="pretrans-resultado"
                    required
                    maxLength={200}
                    value={form.resultado}
                    placeholder="Ingresá el resultado"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        resultado: e.target.value,
                      })
                    }
                  />
                </div>

                {form.tipo === "PRUEBA_CRUZADA" && (
                  <>
                    <div className="pretrans-campo">
                      <label htmlFor="pretrans-unidad">
                        Unidad de sangre *
                      </label>

                      <select
                        id="pretrans-unidad"
                        required
                        value={form.unidadSangreId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            unidadSangreId: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          Seleccioná una unidad
                        </option>

                        {unidadesElegibles.map((unidad) => (
                          <option
                            key={unidad.id}
                            value={unidad.id}
                          >
                            {unidad.numeroUnidad}
                            {" - "}
                            {unidad.estado}
                          </option>
                        ))}
                      </select>

                      {unidadesElegibles.length === 0 && (
                        <p className="pretrans-ayuda">
                          No hay unidades elegibles del tipo solicitado.
                          Podés registrarlas desde Recepción de unidades.
                        </p>
                      )}
                    </div>

                    <div className="pretrans-campo">
                      <label htmlFor="pretrans-compatibilidad">
                        Compatibilidad *
                      </label>

                      <select
                        id="pretrans-compatibilidad"
                        required
                        value={form.compatibilidad}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            compatibilidad:
                              e.target.value as Compatibilidad | "",
                          })
                        }
                      >
                        <option value="">Seleccioná</option>
                        <option value="COMPATIBLE">
                          Compatible
                        </option>
                        <option value="INCOMPATIBLE">
                          Incompatible
                        </option>
                      </select>
                    </div>
                  </>
                )}

                <div className="pretrans-campo">
                  <label htmlFor="pretrans-operador">
                    Operador *
                  </label>

                  <input
                    id="pretrans-operador"
                    required
                    maxLength={120}
                    value={form.operador}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        operador: e.target.value,
                      })
                    }
                    placeholder="Nombre del operador"
                  />
                </div>

                <div className="pretrans-campo pretrans-ancho">
                  <label htmlFor="pretrans-observaciones">
                    Observaciones
                  </label>

                  <textarea
                    id="pretrans-observaciones"
                    rows={3}
                    maxLength={500}
                    value={form.observaciones}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        observaciones: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <p className="pretrans-ayuda">
                El resultado informado debe provenir del estudio
                realizado. La aplicación no determina automáticamente
                la compatibilidad clínica ni autoriza transfusiones.
              </p>

              <button
                className="pretrans-boton"
                type="submit"
                disabled={enviando}
              >
                {enviando
                  ? "Guardando..."
                  : "Registrar estudio"}
              </button>
            </form>
          </section>

          <section className="pretrans-panel">
            <h2>3. Historial de estudios</h2>

            {cargandoHistorial ? (
              <p>Cargando historial...</p>
            ) : estudios.length === 0 ? (
              <p>
                Todavía no hay estudios registrados para esta solicitud.
              </p>
            ) : (
              <ol className="pretrans-historial">
                {estudios.map((estudio) => (
                  <li key={estudio.id}>
                    <div className="pretrans-historial-cabecera">
                      <strong>
                        {ETIQUETAS[estudio.tipo]}
                      </strong>
                      <span>
                        {fechaArgentina(estudio.fechaHora)}
                      </span>
                    </div>

                    <p>
                      <strong>Resultado:</strong>{" "}
                      {estudio.resultado}
                    </p>

                    {estudio.unidadSangre && (
                      <p>
                        <strong>Unidad:</strong>{" "}
                        {estudio.unidadSangre.numeroUnidad}
                      </p>
                    )}

                    {estudio.compatibilidad && (
                      <p>
                        <strong>Compatibilidad:</strong>{" "}
                        {estudio.compatibilidad}
                      </p>
                    )}

                    <p>
                      <strong>Operador:</strong>{" "}
                      {estudio.operador}
                    </p>

                    {estudio.observaciones && (
                      <p>
                        <strong>Observaciones:</strong>{" "}
                        {estudio.observaciones}
                      </p>
                    )}

                    {estudio.alerta && (
                      <div
                        className="pretrans-alerta"
                        role="alert"
                      >
                        {estudio.alerta}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </section>
  );
}
