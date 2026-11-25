import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { emitirUnidadFormSchema } from "../schemas/emisionUnidad";
import "../styles/EmitirSangre.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type Solicitud = {
  id: number;
  pacienteId: number | null;
  nombrePaciente: string;
  dniPaciente: string;
  grupoABO: string;
  factorRhD: string;
  tipoHemocomponente: string;
  cantidad: number;
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";
  caracter: string | null;
  irradiado: boolean;
  lavado: boolean;
  desleucocitado: boolean;
  fraccionadoPediatrico: boolean;
};

type Unidad = {
  id: number;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABO: string;
  factorRhD: string;
  fechaVencimiento: string;
  estado: string;
  vencida?: boolean;
  solicitudId?: number | null;
};

type Estudio = {
  id: number;
  tipo: string;
  resultado: string;
  compatibilidad: "COMPATIBLE" | "INCOMPATIBLE" | null;
  fechaHora: string;
  unidadSangre: {
    id: number;
    numeroUnidad: string;
  } | null;
};

type EtiquetaTransfusion = {
  receptor: {
    nombre: string;
    dni: string;
    grupoABO: string;
    factorRhD: string;
  };
  unidad: {
    numeroUnidad: string;
    tipoHemocomponente: string;
    grupoABO: string;
    factorRhD: string;
    fechaVencimiento: string;
  };
  requisitosEspeciales: string | null;
  interpretacionCompatibilidad: string;
  compatibilidadCompleta: boolean;
  caracter: string | null;
  fechaHoraSalida: string;
  responsable: string;
};

type EmisionRegistro = {
  id: number;
  unidadSangreId: number;
  solicitudId: number;
  dniPaciente: string;
  nombrePaciente: string;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABOUnidad: string;
  factorRhDUnidad: string;
  caracter: string | null;
  resultadoCompatibilidad: "COMPATIBLE" | "INCOMPATIBLE" | null;
  compatibilidadCompleta: boolean;
  responsable: string;
  observaciones: string | null;
  fechaHora: string;
  etiqueta: EtiquetaTransfusion;
};

type Banner = {
  tipo: "ok" | "error" | "alerta";
  texto: string;
} | null;

const ETIQUETAS_COMPONENTE: Record<string, string> = {
  GLOBULOS_ROJOS: "Glóbulos rojos",
  PLASMA: "Plasma",
  PLAQUETAS: "Plaquetas",
  CRIOPRECIPITADO: "Crioprecipitado",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  EMITIDA: "Emitida",
  BLOQUEADA: "Bloqueada",
  VENCIDA: "Vencida",
  DADA_DE_BAJA: "Dada de baja",
};

const ETIQUETAS_CARACTER: Record<string, string> = {
  PROGRAMADA: "Programada",
  NO_URGENTE: "No urgente",
  RESERVA: "Reserva",
  URGENTE: "Urgente",
  EMERGENCIA: "Emergencia",
};

function formatearGrupo(abo: string, rh: string) {
  return `${abo}${rh === "POSITIVO" ? "+" : "−"}`;
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

function formatearFechaHora(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}

function requisitosDeSolicitud(solicitud: Solicitud): string {
  const lista: string[] = [];
  if (solicitud.irradiado) lista.push("Irradiado");
  if (solicitud.lavado) lista.push("Lavado");
  if (solicitud.desleucocitado) lista.push("Desleucocitado");
  if (solicitud.fraccionadoPediatrico) lista.push("Fraccionado pediátrico");
  return lista.length > 0 ? lista.join(", ") : "Sin requisitos especiales";
}

export default function EmitirSangre() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [inventario, setInventario] = useState<Unidad[]>([]);
  const [solicitudId, setSolicitudId] = useState("");
  const [unidadesReservadas, setUnidadesReservadas] = useState<Unidad[]>([]);
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [emisionesSolicitud, setEmisionesSolicitud] = useState<EmisionRegistro[]>([]);

  const [unidadEmitiendoId, setUnidadEmitiendoId] = useState<number | null>(null);
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [etiquetaActiva, setEtiquetaActiva] = useState<EtiquetaTransfusion | null>(null);
  const [advertencias, setAdvertencias] = useState<string[]>([]);

  const [unidadConsultaId, setUnidadConsultaId] = useState("");
  const [unidadConsultada, setUnidadConsultada] = useState<Unidad | null>(null);
  const [historialUnidad, setHistorialUnidad] = useState<EmisionRegistro[]>([]);
  const [cargandoHistorialUnidad, setCargandoHistorialUnidad] = useState(false);

  const [banner, setBanner] = useState<Banner>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const solicitudesAprobadas = solicitudes.filter(
    (solicitud) =>
      solicitud.estado === "APROBADA" && solicitud.pacienteId !== null,
  );

  const solicitudSeleccionada = solicitudesAprobadas.find(
    (solicitud) => String(solicitud.id) === solicitudId,
  );

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        const [resSol, resInv] = await Promise.all([
          fetch(`${API_URL}/api/solicitudes-transfusiones?estado=APROBADA`),
          fetch(`${API_URL}/api/inventario-unidades`),
        ]);

        if (!resSol.ok || !resInv.ok) {
          throw new Error("No se pudieron cargar las solicitudes o el inventario.");
        }

        const [datosSol, datosInv] = (await Promise.all([
          resSol.json(),
          resInv.json(),
        ])) as [Solicitud[], Unidad[]];

        if (activo) {
          setSolicitudes(datosSol);
          setInventario(datosInv);
        }
      } catch (error) {
        if (activo) {
          setBanner({
            tipo: "error",
            texto:
              error instanceof Error
                ? error.message
                : "No se pudo conectar con el servidor.",
          });
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargarInicial();
    return () => {
      activo = false;
    };
  }, []);

  async function cargarDetalleSolicitud(id: string) {
    if (!id) return;
    setCargandoDetalle(true);
    try {
      const [resRes, resEst, resEm] = await Promise.all([
        fetch(`${API_URL}/api/solicitudes-transfusiones/${id}/unidades-reservadas`),
        fetch(`${API_URL}/api/solicitudes-transfusiones/${id}/estudios-pretransfusionales`),
        fetch(`${API_URL}/api/solicitudes-transfusiones/${id}/emisiones`),
      ]);

      const [datosRes, datosEst, datosEm] = await Promise.all([
        resRes.json().catch(() => null),
        resEst.json().catch(() => null),
        resEm.json().catch(() => null),
      ]);

      if (!resRes.ok) {
        throw new Error(
          datosRes?.error ?? "No se pudieron cargar las unidades reservadas.",
        );
      }

      setUnidadesReservadas((datosRes?.unidades ?? []) as Unidad[]);
      setEstudios(resEst.ok ? ((datosEst?.estudios ?? []) as Estudio[]) : []);
      setEmisionesSolicitud(
        resEm.ok ? ((datosEm?.emisiones ?? []) as EmisionRegistro[]) : [],
      );
    } catch (error) {
      setBanner({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el detalle de la solicitud.",
      });
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cambiarSolicitud(id: string) {
    setSolicitudId(id);
    setBanner(null);
    setAdvertencias([]);
    setEtiquetaActiva(null);
    setUnidadEmitiendoId(null);
    setObservaciones("");
    setUnidadesReservadas([]);
    setEstudios([]);
    setEmisionesSolicitud([]);
    if (id) {
      void cargarDetalleSolicitud(id);
    }
  }

  function ultimaPruebaCruzadaDe(unidadId: number): Estudio | undefined {
    return estudios.find(
      (estudio) =>
        estudio.tipo === "PRUEBA_CRUZADA" &&
        estudio.unidadSangre?.id === unidadId,
    );
  }

  async function refrescarInventario() {
    const res = await fetch(`${API_URL}/api/inventario-unidades`);
    if (res.ok) {
      setInventario((await res.json()) as Unidad[]);
    }
  }

  async function confirmarEmision(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!solicitudId || unidadEmitiendoId === null) return;
    setBanner(null);
    setAdvertencias([]);

    const parseado = emitirUnidadFormSchema.safeParse({
      responsable,
      observaciones,
    });
    if (!parseado.success) {
      setBanner({
        tipo: "error",
        texto:
          parseado.error.issues[0]?.message ??
          "Revisá los datos de la emisión.",
      });
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(
        `${API_URL}/api/solicitudes-transfusiones/${solicitudId}/unidades/${unidadEmitiendoId}/emitir`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parseado.data),
        },
      );
      const datos = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(datos?.error ?? "No se pudo registrar la emisión.");
      }

      const listaAdvertencias = Array.isArray(datos?.advertencias)
        ? (datos.advertencias as string[])
        : [];
      setAdvertencias(listaAdvertencias);
      setEtiquetaActiva((datos?.etiqueta ?? null) as EtiquetaTransfusion | null);
      setUnidadEmitiendoId(null);
      setObservaciones("");
      setBanner({
        tipo: listaAdvertencias.length > 0 ? "alerta" : "ok",
        texto: `Unidad ${datos.unidad.numeroUnidad} emitida correctamente por ${datos.emision.responsable}.`,
      });

      await Promise.all([
        cargarDetalleSolicitud(solicitudId),
        refrescarInventario(),
      ]);
      if (unidadConsultaId && Number(unidadConsultaId) === unidadEmitiendoId) {
        await consultarHistorialPorUnidad(unidadConsultaId);
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
      setEnviando(false);
    }
  }

  async function consultarHistorialPorUnidad(id: string) {
    setUnidadConsultaId(id);
    setUnidadConsultada(null);
    setHistorialUnidad([]);
    if (!id) return;

    setCargandoHistorialUnidad(true);
    try {
      const res = await fetch(`${API_URL}/api/inventario-unidades/${id}/emisiones`);
      const datos = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          datos?.error ?? "No se pudo consultar el historial de emisiones.",
        );
      }
      setUnidadConsultada(datos.unidad as Unidad);
      setHistorialUnidad((datos.emisiones ?? []) as EmisionRegistro[]);
    } catch (error) {
      setBanner({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo consultar el historial de emisiones.",
      });
    } finally {
      setCargandoHistorialUnidad(false);
    }
  }

  return (
    <section className="emision">
      <header className="emision-header">
        <h1>Emitir sangre para transfusión</h1>
        <p>
          Registrá la salida de unidades reservadas para solicitudes aprobadas,
          emití la etiqueta de transfusión y consultá el historial de emisiones.
        </p>
      </header>

      {banner && (
        <div
          className={`emision-banner emision-banner-${banner.tipo}`}
          role={banner.tipo === "error" ? "alert" : "status"}
        >
          {banner.texto}
        </div>
      )}

      {advertencias.length > 0 && (
        <div className="emision-advertencias" role="alert">
          <strong>Advertencias de emisión:</strong>
          <ul>
            {advertencias.map((adv, idx) => (
              <li key={`${idx}-${adv}`}>{adv}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="emision-panel">
        <h2>1. Solicitud de transfusión aprobada</h2>

        {cargando ? (
          <p className="emision-ayuda">Cargando solicitudes aprobadas…</p>
        ) : (
          <div className="emision-campo">
            <label htmlFor="emisionSolicitud">Solicitud activa</label>
            <select
              id="emisionSolicitud"
              value={solicitudId}
              onChange={(evento) => cambiarSolicitud(evento.target.value)}
            >
              <option value="">Seleccioná una solicitud aprobada</option>
              {solicitudesAprobadas.map((solicitud) => (
                <option key={solicitud.id} value={String(solicitud.id)}>
                  #{solicitud.id} · {solicitud.nombrePaciente} (DNI{" "}
                  {solicitud.dniPaciente}) ·{" "}
                  {formatearGrupo(solicitud.grupoABO, solicitud.factorRhD)} ·{" "}
                  {ETIQUETAS_COMPONENTE[solicitud.tipoHemocomponente] ??
                    solicitud.tipoHemocomponente}
                  {solicitud.caracter === "EMERGENCIA" ? " · EMERGENCIA" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {solicitudSeleccionada && (
          <div className="emision-resumen">
            <div>
              <strong>{solicitudSeleccionada.nombrePaciente}</strong> · DNI{" "}
              <span className="emision-dato">{solicitudSeleccionada.dniPaciente}</span>
            </div>
            <div>
              Receptor:{" "}
              <strong className="emision-dato">
                {formatearGrupo(
                  solicitudSeleccionada.grupoABO,
                  solicitudSeleccionada.factorRhD,
                )}
              </strong>{" "}
              ·{" "}
              {ETIQUETAS_COMPONENTE[solicitudSeleccionada.tipoHemocomponente] ??
                solicitudSeleccionada.tipoHemocomponente}{" "}
              ({solicitudSeleccionada.cantidad} unidad/es) · Carácter:{" "}
              <strong>
                {solicitudSeleccionada.caracter
                  ? (ETIQUETAS_CARACTER[solicitudSeleccionada.caracter] ??
                    solicitudSeleccionada.caracter)
                  : "No especificado"}
              </strong>
            </div>
            <div>Requisitos especiales: {requisitosDeSolicitud(solicitudSeleccionada)}</div>
          </div>
        )}
      </div>

      {solicitudSeleccionada && (
        <div className="emision-panel">
          <h2>2. Unidades reservadas de la solicitud</h2>

          {cargandoDetalle ? (
            <p className="emision-ayuda">Consultando unidades y compatibilidad…</p>
          ) : unidadesReservadas.length === 0 ? (
            <p className="emision-ayuda">
              Esta solicitud no tiene unidades reservadas todavía. Reservalas en
              “Seleccionar componente”.
            </p>
          ) : (
            <div className="emision-lista">
              {unidadesReservadas.map((unidad) => {
                const prueba = ultimaPruebaCruzadaDe(unidad.id);
                const emisionExistente = emisionesSolicitud.find(
                  (e) => e.unidadSangreId === unidad.id,
                );
                const estaAbierta = unidadEmitiendoId === unidad.id;

                return (
                  <article className="emision-unidad-card" key={unidad.id}>
                    <div className="emision-unidad-cabecera">
                      <div>
                        <h3>
                          Unidad <span className="emision-dato">{unidad.numeroUnidad}</span>
                        </h3>
                        <p>
                          {ETIQUETAS_COMPONENTE[unidad.tipoHemocomponente] ??
                            unidad.tipoHemocomponente}{" "}
                          · Grupo{" "}
                          <strong className="emision-dato">
                            {formatearGrupo(unidad.grupoABO, unidad.factorRhD)}
                          </strong>{" "}
                          · Vence:{" "}
                          <span className="emision-dato">
                            {formatearFecha(unidad.fechaVencimiento)}
                          </span>
                          {unidad.vencida ? " (VENCIDA)" : ""}
                        </p>
                      </div>
                      <div className="emision-badges">
                        <span
                          className={`emision-chip emision-chip-${unidad.estado.toLowerCase()}`}
                        >
                          {ETIQUETAS_ESTADO[unidad.estado] ?? unidad.estado}
                        </span>
                        <span
                          className={`emision-chip ${
                            prueba?.compatibilidad === "COMPATIBLE"
                              ? "emision-chip-compatible"
                              : prueba?.compatibilidad === "INCOMPATIBLE"
                                ? "emision-chip-incompatible"
                                : "emision-chip-sinprueba"
                          }`}
                        >
                          {prueba?.compatibilidad === "COMPATIBLE"
                            ? "Prueba cruzada: Compatible"
                            : prueba?.compatibilidad === "INCOMPATIBLE"
                              ? "Prueba cruzada: Incompatible"
                              : "Sin prueba cruzada"}
                        </span>
                      </div>
                    </div>

                    <div className="emision-acciones">
                      {unidad.estado === "RESERVADA" && (
                        <button
                          type="button"
                          className="emision-boton"
                          onClick={() => {
                            setUnidadEmitiendoId(unidad.id);
                            setBanner(null);
                          }}
                        >
                          Emitir unidad
                        </button>
                      )}
                      {emisionExistente && (
                        <button
                          type="button"
                          className="emision-boton-secundario"
                          onClick={() => setEtiquetaActiva(emisionExistente.etiqueta)}
                        >
                          Ver etiqueta
                        </button>
                      )}
                    </div>

                    {estaAbierta && (
                      <form
                        className="emision-form-inline"
                        onSubmit={confirmarEmision}
                        noValidate
                      >
                        {prueba?.compatibilidad === "INCOMPATIBLE" && (
                          <p className="emision-alerta-inline" role="alert">
                            La última prueba cruzada es INCOMPATIBLE. El servidor
                            bloqueará la emisión de esta unidad.
                          </p>
                        )}
                        {!prueba && (
                          <p className="emision-aviso-inline" role="status">
                            {solicitudSeleccionada.caracter === "EMERGENCIA"
                              ? "Solicitud de EMERGENCIA sin prueba cruzada: se emitirá con la leyenda normativa de compatibilidad no completada."
                              : "Esta unidad no tiene prueba cruzada registrada. Si confirmás, se emitirá con advertencia."}
                          </p>
                        )}
                        <div className="emision-grid">
                          <div className="emision-campo">
                            <label htmlFor={`responsable-${unidad.id}`}>
                              Responsable de la emisión (obligatorio)
                            </label>
                            <input
                              id={`responsable-${unidad.id}`}
                              required
                              maxLength={120}
                              placeholder="Nombre y apellido del responsable"
                              value={responsable}
                              onChange={(evento) =>
                                setResponsable(evento.target.value)
                              }
                            />
                          </div>
                          <div className="emision-campo">
                            <label htmlFor={`observaciones-${unidad.id}`}>
                              Observaciones (opcional)
                            </label>
                            <input
                              id={`observaciones-${unidad.id}`}
                              maxLength={500}
                              placeholder="Ej.: Retira enfermería de sala 4"
                              value={observaciones}
                              onChange={(evento) =>
                                setObservaciones(evento.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="emision-acciones">
                          <button
                            type="submit"
                            className="emision-boton"
                            disabled={enviando}
                          >
                            {enviando ? "Emitiendo…" : "Confirmar emisión"}
                          </button>
                          <button
                            type="button"
                            className="emision-boton-secundario"
                            onClick={() => setUnidadEmitiendoId(null)}
                          >
                            Volver
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {etiquetaActiva && (
        <section
          className="emision-panel emision-etiqueta"
          aria-label="Etiqueta de transfusión"
        >
          <div className="emision-etiqueta-cabecera">
            <div>
              <h2>Etiqueta de transfusión</h2>
              <p>Servicio de Hemoterapia · Rótulo de salida</p>
            </div>
            <div className="emision-acciones emision-no-imprimir">
              <button
                type="button"
                className="emision-boton"
                onClick={() => window.print()}
              >
                Imprimir etiqueta
              </button>
              <button
                type="button"
                className="emision-boton-secundario"
                onClick={() => setEtiquetaActiva(null)}
              >
                Cerrar
              </button>
            </div>
          </div>

          <dl className="emision-etiqueta-grid">
            <div>
              <dt>Receptor</dt>
              <dd>{etiquetaActiva.receptor.nombre}</dd>
            </div>
            <div>
              <dt>DNI del receptor</dt>
              <dd className="emision-dato">{etiquetaActiva.receptor.dni}</dd>
            </div>
            <div>
              <dt>Grupo ABO / Rh receptor</dt>
              <dd className="emision-dato">
                {formatearGrupo(
                  etiquetaActiva.receptor.grupoABO,
                  etiquetaActiva.receptor.factorRhD,
                )}
              </dd>
            </div>
            <div>
              <dt>Número de unidad</dt>
              <dd className="emision-dato">{etiquetaActiva.unidad.numeroUnidad}</dd>
            </div>
            <div>
              <dt>Componente</dt>
              <dd>
                {ETIQUETAS_COMPONENTE[etiquetaActiva.unidad.tipoHemocomponente] ??
                  etiquetaActiva.unidad.tipoHemocomponente}
              </dd>
            </div>
            <div>
              <dt>Grupo ABO / Rh unidad</dt>
              <dd className="emision-dato">
                {formatearGrupo(
                  etiquetaActiva.unidad.grupoABO,
                  etiquetaActiva.unidad.factorRhD,
                )}
              </dd>
            </div>
            <div>
              <dt>Fecha de caducidad</dt>
              <dd className="emision-dato">
                {formatearFecha(etiquetaActiva.unidad.fechaVencimiento)}
              </dd>
            </div>
            <div>
              <dt>Requisitos especiales</dt>
              <dd>{etiquetaActiva.requisitosEspeciales ?? "Ninguno"}</dd>
            </div>
            <div>
              <dt>Fecha y hora de salida</dt>
              <dd className="emision-dato">
                {formatearFechaHora(etiquetaActiva.fechaHoraSalida)}
              </dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{etiquetaActiva.responsable}</dd>
            </div>
          </dl>

          <p
            className={
              etiquetaActiva.compatibilidadCompleta
                ? "emision-compat-ok"
                : "emision-compat-incompleta"
            }
          >
            Compatibilidad: {etiquetaActiva.interpretacionCompatibilidad}
          </p>
        </section>
      )}

      {solicitudSeleccionada && (
        <div className="emision-panel">
          <h2>3. Emisiones registradas de esta solicitud</h2>
          {emisionesSolicitud.length === 0 ? (
            <p className="emision-ayuda">
              Todavía no se emitieron unidades para esta solicitud.
            </p>
          ) : (
            <ol className="emision-historial">
              {emisionesSolicitud.map((emision) => (
                <li key={emision.id}>
                  <div className="emision-historial-cabecera">
                    <strong>
                      Unidad <span className="emision-dato">{emision.numeroUnidad}</span> ·{" "}
                      {emision.nombrePaciente} (DNI{" "}
                      <span className="emision-dato">{emision.dniPaciente}</span>)
                    </strong>
                    <span className="emision-dato">
                      {formatearFechaHora(emision.fechaHora)}
                    </span>
                  </div>
                  <p>
                    Responsable: <strong>{emision.responsable}</strong> ·{" "}
                    {emision.etiqueta.interpretacionCompatibilidad}
                  </p>
                  {emision.observaciones && (
                    <p>Observaciones: {emision.observaciones}</p>
                  )}
                  <button
                    type="button"
                    className="emision-boton-secundario"
                    onClick={() => setEtiquetaActiva(emision.etiqueta)}
                  >
                    Ver etiqueta
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="emision-panel emision-no-imprimir">
        <h2>Consultar historial de emisiones por unidad</h2>
        <div className="emision-campo">
          <label htmlFor="emisionConsultaUnidad">Unidad de inventario</label>
          <select
            id="emisionConsultaUnidad"
            value={unidadConsultaId}
            onChange={(evento) =>
              void consultarHistorialPorUnidad(evento.target.value)
            }
          >
            <option value="">Seleccioná una unidad para ver su historial</option>
            {inventario.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.numeroUnidad} ·{" "}
                {ETIQUETAS_COMPONENTE[u.tipoHemocomponente] ?? u.tipoHemocomponente}{" "}
                {formatearGrupo(u.grupoABO, u.factorRhD)} (
                {ETIQUETAS_ESTADO[u.estado] ?? u.estado})
              </option>
            ))}
          </select>
        </div>

        {cargandoHistorialUnidad && (
          <p className="emision-ayuda">Consultando historial de la unidad…</p>
        )}

        {!cargandoHistorialUnidad && unidadConsultada && (
          <div className="emision-historial-unidad">
            <p className="emision-ayuda">
              Estado actual de <strong>{unidadConsultada.numeroUnidad}</strong>:{" "}
              <strong>
                {ETIQUETAS_ESTADO[unidadConsultada.estado] ?? unidadConsultada.estado}
              </strong>
            </p>
            {historialUnidad.length === 0 ? (
              <p className="emision-ayuda">
                Esta unidad no tiene emisiones registradas.
              </p>
            ) : (
              <ol className="emision-historial">
                {historialUnidad.map((emision) => (
                  <li key={emision.id}>
                    <div className="emision-historial-cabecera">
                      <strong>
                        Solicitud #{emision.solicitudId} · {emision.nombrePaciente} (DNI{" "}
                        <span className="emision-dato">{emision.dniPaciente}</span>)
                      </strong>
                      <span className="emision-dato">
                        {formatearFechaHora(emision.fechaHora)}
                      </span>
                    </div>
                    <p>
                      Responsable: <strong>{emision.responsable}</strong> ·{" "}
                      {emision.etiqueta.interpretacionCompatibilidad}
                    </p>
                    {emision.observaciones && (
                      <p>Observaciones: {emision.observaciones}</p>
                    )}
                    <button
                      type="button"
                      className="emision-boton-secundario"
                      onClick={() => setEtiquetaActiva(emision.etiqueta)}
                    >
                      Ver etiqueta
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
