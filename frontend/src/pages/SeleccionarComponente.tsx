import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import "../styles/SeleccionarComponente.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
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
  EMITIDA: "Emitida",
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
  const [cantidadRequerida, setCantidadRequerida] = useState(0);
  const [unidadesPreparadas, setUnidadesPreparadas] = useState(0);
  const [unidadesRestantes, setUnidadesRestantes] = useState(0);
  const [operador, setOperador] = useState("");
  const [filtroComponente, setFiltroComponente] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroUnidadesGrupo, setFiltroUnidadesGrupo] = useState("");
  const [filtroUnidadesVencimiento, setFiltroUnidadesVencimiento] = useState("");
  const [filtroPreparadasGrupo, setFiltroPreparadasGrupo] = useState("");
  const [filtroPreparadasVencimiento, setFiltroPreparadasVencimiento] = useState("");

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

        if (!Array.isArray(datos)) {
          throw new Error("La respuesta del servidor no tiene el formato esperado.");
        }

        if (cancelado) return;

        setSolicitudes(datos as Solicitud[]);

        if (datos.length === 0) {
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
    setCantidadRequerida(0);
    setUnidadesPreparadas(0);
    setUnidadesRestantes(0);

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

      if (!datos || !Array.isArray(datos.unidades)) {
        throw new Error("La respuesta del servidor no tiene el formato esperado.");
      }

      setUnidades(datos.unidades as Unidad[]);
      setMensajeServidor(datos.mensaje as string);
      setCantidadRequerida(Number(datos.cantidadRequerida ?? 0));
      setUnidadesPreparadas(Number(datos.unidadesPreparadas ?? 0));
      setUnidadesRestantes(Number(datos.unidadesRestantes ?? 0));

      if (datos.sinUnidadesDisponibles) {
        setBanner({ tipo: "aviso", texto: datos.mensaje as string });
      } else {
        setBanner({ tipo: "ok", texto: datos.mensaje as string });
      }

      const datosPreparadas = await respuestaPreparadas.json().catch(() => null);

      if (!respuestaPreparadas.ok) {
        throw new Error(
          datosPreparadas?.error ||
            "No se pudieron consultar las unidades preparadas.",
        );
      }

      if (!datosPreparadas || !Array.isArray(datosPreparadas.unidades)) {
        throw new Error("La respuesta del servidor no tiene el formato esperado.");
      }

      setPreparadas(datosPreparadas.unidades as Unidad[]);
      setMensajePreparadas((datosPreparadas.mensaje ?? "") as string);
      setUnidadesPreparadas(
        Number(datosPreparadas.unidadesPreparadas ?? datos.unidadesPreparadas ?? 0),
      );
      setUnidadesRestantes(
        Number(datosPreparadas.unidadesRestantes ?? datos.unidadesRestantes ?? 0),
      );
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

  async function preparar(unidad: Unidad) {
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

  const columnasSolicitudes: DataTableColumn<Solicitud>[] = [
    {
      id: "id",
      header: "Solicitud",
      render: (solicitud) => <strong>#{solicitud.id}</strong>,
      sortValue: (solicitud) => solicitud.id,
    },
    {
      id: "paciente",
      header: "Paciente",
      render: (solicitud) => solicitud.nombrePaciente,
      sortValue: (solicitud) => solicitud.nombrePaciente,
    },
    {
      id: "dni",
      header: "DNI",
      render: (solicitud) => solicitud.dniPaciente,
      sortValue: (solicitud) => solicitud.dniPaciente,
    },
    {
      id: "receptor",
      header: "Receptor",
      render: (solicitud) => etiquetaReceptor(solicitud),
      sortValue: (solicitud) => etiquetaReceptor(solicitud),
    },
    {
      id: "componente",
      header: "Componente",
      render: (solicitud) =>
        etiquetasHemocomponente[solicitud.tipoHemocomponente] ??
        solicitud.tipoHemocomponente,
      sortValue: (solicitud) => solicitud.tipoHemocomponente,
    },
    {
      id: "cantidad",
      header: "Cantidad",
      render: (solicitud) => solicitud.cantidad,
      sortValue: (solicitud) => solicitud.cantidad,
    },
  ];

  const opcionesGrupo: DataTableFilter["options"] = [
    { value: "", label: "Todos" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "AB", label: "AB" },
    { value: "O", label: "O" },
  ];

  const opcionesVencimiento: DataTableFilter["options"] = [
    { value: "", label: "Todas" },
    { value: "vigente", label: "Vigente" },
    { value: "vencida", label: "Vencida" },
  ];

  const filtrosUnidades: DataTableFilter[] = [
    {
      id: "grupoUnidades",
      label: "Grupo",
      value: filtroUnidadesGrupo,
      options: opcionesGrupo,
      onChange: setFiltroUnidadesGrupo,
    },
    {
      id: "vencimientoUnidades",
      label: "Vencimiento",
      value: filtroUnidadesVencimiento,
      options: opcionesVencimiento,
      onChange: setFiltroUnidadesVencimiento,
    },
  ];

  const filtrosPreparadas: DataTableFilter[] = [
    {
      id: "grupoPreparadas",
      label: "Grupo",
      value: filtroPreparadasGrupo,
      options: opcionesGrupo,
      onChange: setFiltroPreparadasGrupo,
    },
    {
      id: "vencimientoPreparadas",
      label: "Vencimiento",
      value: filtroPreparadasVencimiento,
      options: opcionesVencimiento,
      onChange: setFiltroPreparadasVencimiento,
    },
  ];

  const columnasUnidades: DataTableColumn<Unidad>[] = [
    {
      id: "unidad",
      header: "Unidad",
      render: (unidad) => <strong>{unidad.numeroUnidad}</strong>,
      sortValue: (unidad) => unidad.numeroUnidad,
    },
    {
      id: "grupo",
      header: "Grupo",
      render: (unidad) => unidad.grupoABO,
      sortValue: (unidad) => unidad.grupoABO,
    },
    {
      id: "factor",
      header: "Factor",
      render: (unidad) =>
        unidad.factorRhD === "POSITIVO" ? "Positivo (+)" : "Negativo (-)",
      sortValue: (unidad) => unidad.factorRhD,
    },
    {
      id: "vencimiento",
      header: "Vencimiento",
      render: (unidad) =>
        new Date(unidad.fechaVencimiento).toLocaleDateString("es-AR"),
      sortValue: (unidad) => unidad.fechaVencimiento,
    },
    {
      id: "estado",
      header: "Estado",
      render: (unidad) => (
        <StatusBadge
          estado={unidad.vencida ? "VENCIDA" : unidad.estado}
          etiqueta={unidad.vencida ? "Vencida" : etiquetasEstado[unidad.estado] ?? unidad.estado}
        />
      ),
      sortValue: (unidad) => unidad.vencida ? "VENCIDA" : unidad.estado,
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "ui-col-acciones",
      render: (unidad) => (
        <div className="ui-row-actions">
          <button
            type="button"
            className="ui-btn ui-btn-small ui-btn-primary"
            disabled={
              preparandoId !== null ||
              !operador.trim() ||
              unidadesRestantes <= 0
            }
            onClick={() => void preparar(unidad)}
          >
            {preparandoId === unidad.id ? "Preparando..." : "Preparar"}
          </button>
        </div>
      ),
    },
  ];

  const columnasPreparadas: DataTableColumn<Unidad>[] = [
    {
      id: "unidad",
      header: "Unidad",
      render: (unidad) => <strong>{unidad.numeroUnidad}</strong>,
      sortValue: (unidad) => unidad.numeroUnidad,
    },
    {
      id: "grupo",
      header: "Grupo",
      render: (unidad) => unidad.grupoABO,
      sortValue: (unidad) => unidad.grupoABO,
    },
    {
      id: "factor",
      header: "Factor",
      render: (unidad) =>
        unidad.factorRhD === "POSITIVO" ? "Positivo (+)" : "Negativo (-)",
      sortValue: (unidad) => unidad.factorRhD,
    },
    {
      id: "vencimiento",
      header: "Vencimiento",
      render: (unidad) =>
        new Date(unidad.fechaVencimiento).toLocaleDateString("es-AR"),
      sortValue: (unidad) => unidad.fechaVencimiento,
    },
    {
      id: "estado",
      header: "Estado",
      render: (unidad) => (
        <StatusBadge
          estado={unidad.vencida ? "VENCIDA" : unidad.estado}
          etiqueta={unidad.vencida ? "Vencida" : etiquetasEstado[unidad.estado] ?? unidad.estado}
        />
      ),
      sortValue: (unidad) => unidad.vencida ? "VENCIDA" : unidad.estado,
    },
    {
      id: "reservadaPor",
      header: "Reservada por",
      render: (unidad) => unidad.reservadaPor ?? "—",
      sortValue: (unidad) => unidad.reservadaPor ?? "",
    },
    {
      id: "reservadaEn",
      header: "Fecha de reserva",
      render: (unidad) =>
        unidad.reservadaEn
          ? new Date(unidad.reservadaEn).toLocaleString("es-AR")
          : "—",
      sortValue: (unidad) => unidad.reservadaEn ?? "",
    },
  ];

  function textoUnidad(unidad: Unidad) {
    return [
      unidad.numeroUnidad,
      unidad.grupoABO,
      unidad.factorRhD,
      unidad.fechaVencimiento,
      unidad.estado,
      unidad.reservadaPor ?? "",
      unidad.reservadaEn ?? "",
    ].join(" ");
  }

  function cumpleFiltrosUnidad(
    unidad: Unidad,
    grupo: string,
    vencimiento: string,
  ) {
    return (
      (!grupo || unidad.grupoABO === grupo) &&
      (!vencimiento ||
        (vencimiento === "vencida" ? unidad.vencida : !unidad.vencida))
    );
  }

  return (
    <div className="seleccion-container">
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

        <DataTable
          rows={solicitudes}
          columns={columnasSolicitudes}
          rowKey={(solicitud) => solicitud.id}
          searchText={(solicitud) =>
            `${solicitud.id} ${solicitud.nombrePaciente} ${solicitud.dniPaciente} ${solicitud.tipoHemocomponente}`
          }
          searchPlaceholder="Buscar por solicitud, paciente, DNI o componente…"
          filters={[
            {
              id: "componente",
              label: "Componente",
              value: filtroComponente,
              options: [
                { value: "", label: "Todos" },
                ...Object.entries(etiquetasHemocomponente).map(
                  ([valor, etiqueta]) => ({ value: valor, label: etiqueta }),
                ),
              ],
              onChange: setFiltroComponente,
            },
            {
              id: "grupo",
              label: "Grupo",
              value: filtroGrupo,
              options: [
                { value: "", label: "Todos" },
                { value: "A", label: "A" },
                { value: "B", label: "B" },
                { value: "AB", label: "AB" },
                { value: "O", label: "O" },
              ],
              onChange: setFiltroGrupo,
            },
          ]}
          filterRow={(solicitud) =>
            (!filtroComponente ||
              solicitud.tipoHemocomponente === filtroComponente) &&
            (!filtroGrupo || solicitud.grupoABO === filtroGrupo)
          }
          loading={cargandoSolicitudes}
          emptyTitle="No hay solicitudes aprobadas"
          emptyDescription="No hay solicitudes de transfusión aprobadas para preparar componentes."
          caption="Solicitudes aprobadas disponibles para seleccionar."
          onRowClick={(solicitud) => {
            const valor = String(solicitud.id);
            setSolicitudId(valor);
            void consultarUnidades(valor);
          }}
        />

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

          {!consultando && (
            <p
              className={`seleccion-contador${unidadesRestantes <= 0 ? " seleccion-contador-completo" : ""}`}
              role="status"
            >
              Preparadas: {unidadesPreparadas} de {cantidadRequerida} requeridas
              {unidadesRestantes > 0
                ? ` · quedan ${unidadesRestantes} por preparar`
                : " · cantidad máxima alcanzada"}
            </p>
          )}

          {!consultando && (
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

              <DataTable
                rows={unidades}
                columns={columnasUnidades}
                rowKey={(unidad) => unidad.id}
                searchText={textoUnidad}
                searchPlaceholder="Buscar por unidad, grupo, factor, vencimiento o estado…"
                filters={filtrosUnidades}
                filterRow={(unidad) =>
                  cumpleFiltrosUnidad(
                    unidad,
                    filtroUnidadesGrupo,
                    filtroUnidadesVencimiento,
                  )
                }
                loading={consultando}
                emptyTitle="No hay unidades compatibles"
                emptyDescription={
                  mensajeServidor ||
                  "No hay unidades compatibles disponibles para esta solicitud."
                }
                caption="Unidades compatibles disponibles para preparar."
              />
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
            <p className="seleccion-nota">
              {mensajePreparadas} Se mantienen en esta pantalla hasta que la
              solicitud cambie de estado.
            </p>
          )}

          <DataTable
            rows={preparadas}
            columns={columnasPreparadas}
            rowKey={(unidad) => unidad.id}
            searchText={textoUnidad}
            searchPlaceholder="Buscar por unidad, grupo, factor, vencimiento o reserva…"
            filters={filtrosPreparadas}
            filterRow={(unidad) =>
              cumpleFiltrosUnidad(
                unidad,
                filtroPreparadasGrupo,
                filtroPreparadasVencimiento,
              )
            }
            loading={consultando}
            emptyTitle="No hay unidades preparadas"
            emptyDescription="Todavía no hay unidades preparadas para esta solicitud."
            caption="Unidades preparadas para la solicitud seleccionada."
          />
        </section>
      )}
    </div>
  );
}
