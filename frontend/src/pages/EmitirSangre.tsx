import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { FormSteps } from "../components/FormSteps";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { emitirUnidadFormSchema } from "../schemas/emisionUnidad";
import { useEmisionesGlobales } from "../hooks/useDatos";
import "../styles/EmitirSangre.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
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

type BannerEstado = {
  tipo: "ok" | "error" | "alerta";
  texto: string;
} | null;

const PASOS = [
  "Solicitud y donante",
  "Unidades y compatibilidad",
  "Confirmación y emisión",
] as const;

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

const OPCIONES_COMPONENTE = [
  { value: "", label: "Todos" },
  ...Object.entries(ETIQUETAS_COMPONENTE).map(([value, label]) => ({ value, label })),
];

const OPCIONES_ESTADO_UNIDAD = [
  { value: "", label: "Todos" },
  ...Object.entries(ETIQUETAS_ESTADO).map(([value, label]) => ({ value, label })),
];

const OPCIONES_CARACTER = [
  { value: "", label: "Todos" },
  ...Object.entries(ETIQUETAS_CARACTER).map(([value, label]) => ({ value, label })),
  { value: "NO_ESPECIFICADO", label: "No especificado" },
];

const OPCIONES_GRUPO_FACTOR = [
  { value: "", label: "Todos" },
  ...["A", "B", "AB", "0"].flatMap((abo) =>
    ["POSITIVO", "NEGATIVO"].map((rh) => ({
      value: formatearGrupo(abo, rh),
      label: formatearGrupo(abo, rh),
    })),
  ),
];

const OPCIONES_PRUEBA_CRUZADA = [
  { value: "", label: "Todas" },
  { value: "COMPATIBLE", label: "Compatible" },
  { value: "INCOMPATIBLE", label: "Incompatible" },
  { value: "SIN_PRUEBA", label: "Sin prueba cruzada" },
];

const OPCIONES_COMPATIBILIDAD_EMISION = [
  { value: "", label: "Todas" },
  { value: "COMPLETA", label: "Completa" },
  { value: "ADVERTENCIA", label: "Con advertencia" },
];

function opcionesAnio<T>(
  filas: T[],
  fechaDe: (fila: T) => string,
  seleccionado: string,
) {
  const anios = Array.from(
    new Set(
      filas
        .map((fila) => fechaDe(fila)?.slice(0, 4) ?? "")
        .filter((anio) => /^\d{4}$/.test(anio)),
    ),
  );
  if (seleccionado && !anios.includes(seleccionado)) anios.push(seleccionado);
  return [
    { value: "", label: "Todos" },
    ...anios.sort().map((anio) => ({ value: anio, label: anio })),
  ];
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

const columnasSolicitudesAprobadas: DataTableColumn<Solicitud>[] = [
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
    render: (solicitud) =>
      formatearGrupo(solicitud.grupoABO, solicitud.factorRhD),
    sortValue: (solicitud) =>
      formatearGrupo(solicitud.grupoABO, solicitud.factorRhD),
  },
  {
    id: "componente",
    header: "Componente",
    render: (solicitud) =>
      ETIQUETAS_COMPONENTE[solicitud.tipoHemocomponente] ??
      solicitud.tipoHemocomponente,
    sortValue: (solicitud) => solicitud.tipoHemocomponente,
  },
  {
    id: "cantidad",
    header: "Cantidad",
    render: (solicitud) => solicitud.cantidad,
    sortValue: (solicitud) => solicitud.cantidad,
  },
  {
    id: "caracter",
    header: "Carácter",
    render: (solicitud) =>
      solicitud.caracter
        ? (ETIQUETAS_CARACTER[solicitud.caracter] ?? solicitud.caracter)
        : "No especificado",
    sortValue: (solicitud) => solicitud.caracter ?? "",
  },
];

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

  const [banner, setBanner] = useState<BannerEstado>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [confirmandoEmision, setConfirmandoEmision] = useState(false);
  const [filtroCompatibilidadEmisiones, setFiltroCompatibilidadEmisiones] =
    useState("");
  const [filtroComponenteSolicitudes, setFiltroComponenteSolicitudes] =
    useState("");
  const [filtroGrupoSolicitudes, setFiltroGrupoSolicitudes] = useState("");
  const [filtroCaracterSolicitudes, setFiltroCaracterSolicitudes] = useState("");
  const [filtroEstadoUnidades, setFiltroEstadoUnidades] = useState("");
  const [filtroComponenteUnidades, setFiltroComponenteUnidades] = useState("");
  const [filtroGrupoUnidades, setFiltroGrupoUnidades] = useState("");
  const [filtroPruebaCruzadaUnidades, setFiltroPruebaCruzadaUnidades] =
    useState("");
  const [filtroAnioVencimientoUnidades, setFiltroAnioVencimientoUnidades] =
    useState("");
  const [filtroCompatibilidadEmisionesSolicitud, setFiltroCompatibilidadEmisionesSolicitud] =
    useState("");
  const [filtroAnioEmisionesSolicitud, setFiltroAnioEmisionesSolicitud] =
    useState("");
  const [filtroCompatibilidadHistorial, setFiltroCompatibilidadHistorial] =
    useState("");
  const [filtroAnioHistorial, setFiltroAnioHistorial] = useState("");
  const [filtroAnioGlobales, setFiltroAnioGlobales] = useState("");
  const {
    datos: emisionesGlobales,
    cargando: cargandoEmisionesGlobales,
    error: errorEmisionesGlobales,
    recargar: recargarEmisionesGlobales,
  } = useEmisionesGlobales();

  const solicitudesAprobadas = solicitudes.filter(
    (solicitud) =>
      solicitud.estado === "APROBADA" && solicitud.pacienteId !== null,
  );

  const solicitudSeleccionada = solicitudesAprobadas.find(
    (solicitud) => String(solicitud.id) === solicitudId,
  );

  const unidadEnEmision =
    unidadesReservadas.find((unidad) => unidad.id === unidadEmitiendoId) ?? null;
  const pruebaEnEmision = unidadEnEmision
    ? ultimaPruebaCruzadaDe(unidadEnEmision.id)
    : undefined;
  const compatibilidadEnEmision = pruebaEnEmision?.compatibilidad;
  const textoCompatibilidadEnEmision =
    compatibilidadEnEmision === "COMPATIBLE"
      ? "Prueba cruzada: Compatible"
      : compatibilidadEnEmision === "INCOMPATIBLE"
        ? "Prueba cruzada: Incompatible"
        : "Sin prueba cruzada";

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

  async function confirmarEmision() {
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

    setGuardando(true);
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
      setPaso(1);
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
      setGuardando(false);
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

  function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (paso < PASOS.length - 1) {
      setBanner(null);
      setPaso(paso + 1);
      return;
    }

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
      const campo = parseado.error.issues[0]?.path[0];
      if (typeof campo === "string" && unidadEmitiendoId !== null) {
        document.getElementById(`${campo}-${unidadEmitiendoId}`)?.focus();
      }
      return;
    }

    setConfirmandoEmision(true);
  }

  const columnasUnidades: DataTableColumn<Unidad>[] = [
    {
      id: "numeroUnidad",
      header: "Unidad",
      sortValue: (unidad) => unidad.numeroUnidad,
      render: (unidad) => (
        <strong className="emision-dato">{unidad.numeroUnidad}</strong>
      ),
    },
    {
      id: "tipoHemocomponente",
      header: "Hemocomponente",
      sortValue: (unidad) => unidad.tipoHemocomponente,
      render: (unidad) =>
        ETIQUETAS_COMPONENTE[unidad.tipoHemocomponente] ??
        unidad.tipoHemocomponente,
    },
    {
      id: "grupo",
      header: "Grupo",
      sortValue: (unidad) => formatearGrupo(unidad.grupoABO, unidad.factorRhD),
      render: (unidad) => (
        <strong className="emision-dato">
          {formatearGrupo(unidad.grupoABO, unidad.factorRhD)}
        </strong>
      ),
    },
    {
      id: "fechaVencimiento",
      header: "Vencimiento",
      sortValue: (unidad) => unidad.fechaVencimiento,
      render: (unidad) => (
        <>
          <span className="emision-dato">
            {formatearFecha(unidad.fechaVencimiento)}
          </span>
          {unidad.vencida ? " (VENCIDA)" : ""}
        </>
      ),
    },
    {
      id: "estado",
      header: "Estado",
      sortValue: (unidad) => ETIQUETAS_ESTADO[unidad.estado] ?? unidad.estado,
      render: (unidad) => (
        <StatusBadge
          estado={unidad.estado}
          etiqueta={ETIQUETAS_ESTADO[unidad.estado] ?? unidad.estado}
        />
      ),
    },
    {
      id: "compatibilidad",
      header: "Prueba cruzada",
      sortValue: (unidad) => {
        const compatibilidad = ultimaPruebaCruzadaDe(unidad.id)?.compatibilidad;
        return compatibilidad === "COMPATIBLE"
          ? "Prueba cruzada: Compatible"
          : compatibilidad === "INCOMPATIBLE"
            ? "Prueba cruzada: Incompatible"
            : "Sin prueba cruzada";
      },
      render: (unidad) => {
        const compatibilidad = ultimaPruebaCruzadaDe(unidad.id)?.compatibilidad;
        const etiqueta =
          compatibilidad === "COMPATIBLE"
            ? "Prueba cruzada: Compatible"
            : compatibilidad === "INCOMPATIBLE"
              ? "Prueba cruzada: Incompatible"
              : "Sin prueba cruzada";
        return (
          <StatusBadge estado={compatibilidad ?? "SIN_PRUEBA"} etiqueta={etiqueta} />
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      render: (unidad) => {
        const emisionExistente = emisionesSolicitud.find(
          (emision) => emision.unidadSangreId === unidad.id,
        );
        return (
          <div className="ui-row-actions">
            {unidad.estado === "RESERVADA" && (
              <button
                type="button"
                className="ui-btn ui-btn-small ui-btn-primary"
                aria-pressed={unidadEmitiendoId === unidad.id}
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
                className="ui-btn ui-btn-small ui-btn-secondary"
                onClick={() => setEtiquetaActiva(emisionExistente.etiqueta)}
              >
                Ver etiqueta
              </button>
            )}
          </div>
        );
      },
    },
];

  function textoBusquedaUnidad(unidad: Unidad) {
    const compatibilidad = ultimaPruebaCruzadaDe(unidad.id)?.compatibilidad;
    return [
      unidad.numeroUnidad,
      ETIQUETAS_COMPONENTE[unidad.tipoHemocomponente] ?? unidad.tipoHemocomponente,
      formatearGrupo(unidad.grupoABO, unidad.factorRhD),
      formatearFecha(unidad.fechaVencimiento),
      ETIQUETAS_ESTADO[unidad.estado] ?? unidad.estado,
      compatibilidad === "COMPATIBLE"
        ? "Prueba cruzada: Compatible"
        : compatibilidad === "INCOMPATIBLE"
          ? "Prueba cruzada: Incompatible"
          : "Sin prueba cruzada",
    ].join(" ");
  }

  const columnasEmisiones = useMemo<DataTableColumn<EmisionRegistro>[]>(
    () => [
      {
        id: "numeroUnidad",
        header: "Unidad",
        sortValue: (emision) => emision.numeroUnidad,
        render: (emision) => (
          <strong className="emision-dato">{emision.numeroUnidad}</strong>
        ),
      },
      {
        id: "paciente",
        header: "Paciente",
        sortValue: (emision) => emision.nombrePaciente,
        render: (emision) => (
          <>
            {emision.nombrePaciente} (DNI{" "}
            <span className="emision-dato">{emision.dniPaciente}</span>)
          </>
        ),
      },
      {
        id: "fechaHora",
        header: "Fecha y hora",
        sortValue: (emision) => emision.fechaHora,
        render: (emision) => (
          <span className="emision-dato">{formatearFechaHora(emision.fechaHora)}</span>
        ),
      },
      {
        id: "responsable",
        header: "Responsable",
        sortValue: (emision) => emision.responsable,
        render: (emision) => <strong>{emision.responsable}</strong>,
      },
      {
        id: "compatibilidad",
        header: "Compatibilidad",
        sortValue: (emision) => emision.etiqueta.interpretacionCompatibilidad,
        render: (emision) => emision.etiqueta.interpretacionCompatibilidad,
      },
      {
        id: "observaciones",
        header: "Observaciones",
        sortValue: (emision) => emision.observaciones ?? "",
        render: (emision) =>
          emision.observaciones ? `Observaciones: ${emision.observaciones}` : "",
      },
      {
        id: "acciones",
        header: "Acciones",
        render: (emision) => (
          <div className="ui-row-actions">
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={() => setEtiquetaActiva(emision.etiqueta)}
            >
              Ver etiqueta
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  function textoBusquedaEmision(emision: EmisionRegistro) {
    return [
      emision.numeroUnidad,
      emision.nombrePaciente,
      emision.dniPaciente,
      emision.responsable,
      emision.etiqueta.interpretacionCompatibilidad,
      emision.observaciones ?? "",
    ].join(" ");
  }

  const columnasHistorial = useMemo<DataTableColumn<EmisionRegistro>[]>(
    () => [
      {
        id: "solicitudId",
        header: "Solicitud",
        sortValue: (emision) => emision.solicitudId,
        render: (emision) => <>Solicitud #{emision.solicitudId}</>,
      },
      {
        id: "paciente",
        header: "Paciente",
        sortValue: (emision) => emision.nombrePaciente,
        render: (emision) => (
          <>
            {emision.nombrePaciente} (DNI{" "}
            <span className="emision-dato">{emision.dniPaciente}</span>)
          </>
        ),
      },
      {
        id: "fechaHora",
        header: "Fecha y hora",
        sortValue: (emision) => emision.fechaHora,
        render: (emision) => (
          <span className="emision-dato">{formatearFechaHora(emision.fechaHora)}</span>
        ),
      },
      {
        id: "responsable",
        header: "Responsable",
        sortValue: (emision) => emision.responsable,
        render: (emision) => <strong>{emision.responsable}</strong>,
      },
      {
        id: "compatibilidad",
        header: "Compatibilidad",
        sortValue: (emision) => emision.etiqueta.interpretacionCompatibilidad,
        render: (emision) => emision.etiqueta.interpretacionCompatibilidad,
      },
      {
        id: "observaciones",
        header: "Observaciones",
        sortValue: (emision) => emision.observaciones ?? "",
        render: (emision) =>
          emision.observaciones ? `Observaciones: ${emision.observaciones}` : "",
      },
      {
        id: "acciones",
        header: "Acciones",
        render: (emision) => (
          <div className="ui-row-actions">
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={() => setEtiquetaActiva(emision.etiqueta)}
            >
              Ver etiqueta
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  function textoBusquedaHistorial(emision: EmisionRegistro) {
    return [
      String(emision.solicitudId),
      emision.nombrePaciente,
      emision.dniPaciente,
      emision.responsable,
      emision.etiqueta.interpretacionCompatibilidad,
      emision.observaciones ?? "",
    ].join(" ");
  }

  return (
    <section className="emision">
      <PageHeader
        title="Emitir sangre para transfusión"
        description="Registrá la salida de unidades reservadas para solicitudes aprobadas, emití la etiqueta de transfusión y consultá el historial de emisiones."
      />

      <div className="emision-no-imprimir">
        {banner ? (
          <Banner tone={banner.tipo === "alerta" ? "aviso" : banner.tipo}>
            {banner.texto}
          </Banner>
        ) : null}

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
      </div>

      <div className="emision-panel emision-no-imprimir">
        <form onSubmit={manejarSubmit} noValidate>
          <FormSteps pasos={PASOS} actual={paso} />

          {paso === 0 && (
            <FormSection title="Solicitud de transfusión aprobada">
              {cargando ? (
                <LoadingState label="Cargando solicitudes aprobadas…" />
              ) : (
                <FormGrid columns={2}>
                  <FormField id="emisionSolicitud" label="Solicitud activa">
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
                  </FormField>
                </FormGrid>
              )}

              <DataTable
                rows={solicitudesAprobadas}
                columns={columnasSolicitudesAprobadas}
                rowKey={(solicitud) => solicitud.id}
                searchText={(solicitud) =>
                  `${solicitud.id} ${solicitud.nombrePaciente} ${solicitud.dniPaciente} ${solicitud.tipoHemocomponente} ${solicitud.caracter ?? ""}`
                }
                searchPlaceholder="Buscar por solicitud, paciente, DNI o componente…"
                filters={[
                  {
                    id: "componenteSolicitudes",
                    label: "Componente",
                    value: filtroComponenteSolicitudes,
                    options: OPCIONES_COMPONENTE,
                    onChange: setFiltroComponenteSolicitudes,
                  },
                  {
                    id: "receptorSolicitudes",
                    label: "Grupo / factor",
                    value: filtroGrupoSolicitudes,
                    options: OPCIONES_GRUPO_FACTOR,
                    onChange: setFiltroGrupoSolicitudes,
                  },
                  {
                    id: "caracterSolicitudes",
                    label: "Carácter",
                    value: filtroCaracterSolicitudes,
                    options: OPCIONES_CARACTER,
                    onChange: setFiltroCaracterSolicitudes,
                  },
                ]}
                filterRow={(solicitud) =>
                  (!filtroComponenteSolicitudes ||
                    solicitud.tipoHemocomponente === filtroComponenteSolicitudes) &&
                  (!filtroGrupoSolicitudes ||
                    formatearGrupo(solicitud.grupoABO, solicitud.factorRhD) ===
                      filtroGrupoSolicitudes) &&
                  (!filtroCaracterSolicitudes ||
                    (solicitud.caracter ?? "NO_ESPECIFICADO") ===
                      filtroCaracterSolicitudes)
                }
                loading={cargando}
                emptyTitle="No hay solicitudes aprobadas para emitir"
                emptyDescription="Aprobá una solicitud en “Solicitudes de transfusión” para poder emitir unidades."
                caption="Solicitudes aprobadas disponibles para emitir sangre."
                onRowClick={(solicitud) => cambiarSolicitud(String(solicitud.id))}
              />

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
            </FormSection>
          )}

          {paso === 1 && (
            <FormSection title="Unidades reservadas de la solicitud">
              {cargandoDetalle ? (
                <LoadingState label="Consultando unidades y compatibilidad…" />
              ) : (
                <DataTable
                  rows={unidadesReservadas}
                  columns={columnasUnidades}
                  rowKey={(unidad) => unidad.id}
                  searchText={textoBusquedaUnidad}
                  searchPlaceholder="Buscar por unidad, componente, grupo, vencimiento o compatibilidad…"
                  filters={[
                    {
                      id: "estadoUnidades",
                      label: "Estado",
                      value: filtroEstadoUnidades,
                      options: OPCIONES_ESTADO_UNIDAD,
                      onChange: setFiltroEstadoUnidades,
                    },
                    {
                      id: "componenteUnidades",
                      label: "Hemocomponente",
                      value: filtroComponenteUnidades,
                      options: OPCIONES_COMPONENTE,
                      onChange: setFiltroComponenteUnidades,
                    },
                    {
                      id: "grupoUnidades",
                      label: "Grupo / factor",
                      value: filtroGrupoUnidades,
                      options: OPCIONES_GRUPO_FACTOR,
                      onChange: setFiltroGrupoUnidades,
                    },
                    {
                      id: "pruebaCruzadaUnidades",
                      label: "Prueba cruzada",
                      value: filtroPruebaCruzadaUnidades,
                      options: OPCIONES_PRUEBA_CRUZADA,
                      onChange: setFiltroPruebaCruzadaUnidades,
                    },
                    {
                      id: "anioVencimientoUnidades",
                      label: "Año de vencimiento",
                      value: filtroAnioVencimientoUnidades,
                      options: opcionesAnio(
                        unidadesReservadas,
                        (unidad) => unidad.fechaVencimiento,
                        filtroAnioVencimientoUnidades,
                      ),
                      onChange: setFiltroAnioVencimientoUnidades,
                    },
                  ]}
                  filterRow={(unidad) =>
                    (!filtroEstadoUnidades ||
                      unidad.estado === filtroEstadoUnidades) &&
                    (!filtroComponenteUnidades ||
                      unidad.tipoHemocomponente === filtroComponenteUnidades) &&
                    (!filtroGrupoUnidades ||
                      formatearGrupo(unidad.grupoABO, unidad.factorRhD) ===
                        filtroGrupoUnidades) &&
                    (!filtroPruebaCruzadaUnidades ||
                      (ultimaPruebaCruzadaDe(unidad.id)?.compatibilidad ??
                        "SIN_PRUEBA") === filtroPruebaCruzadaUnidades) &&
                    (!filtroAnioVencimientoUnidades ||
                      unidad.fechaVencimiento.startsWith(
                        filtroAnioVencimientoUnidades,
                      ))
                  }
                  emptyTitle="Esta solicitud no tiene unidades reservadas todavía. Reservalas en “Seleccionar componente”."
                  caption="Unidades reservadas de la solicitud"
                />
              )}
            </FormSection>
          )}

          {paso === 2 && unidadEnEmision && (
            <FormSection title="Confirmación y emisión">
              <div className="emision-resumen">
                <div>
                  <strong>
                    Unidad{" "}
                    <span className="emision-dato">{unidadEnEmision.numeroUnidad}</span>
                  </strong>
                </div>
                <div>
                  {ETIQUETAS_COMPONENTE[unidadEnEmision.tipoHemocomponente] ??
                    unidadEnEmision.tipoHemocomponente}{" "}
                  · Grupo{" "}
                  <strong className="emision-dato">
                    {formatearGrupo(unidadEnEmision.grupoABO, unidadEnEmision.factorRhD)}
                  </strong>{" "}
                  · Vence:{" "}
                  <span className="emision-dato">
                    {formatearFecha(unidadEnEmision.fechaVencimiento)}
                  </span>
                  {unidadEnEmision.vencida ? " (VENCIDA)" : ""}
                </div>
                <div className="emision-badges">
                  <StatusBadge
                    estado={unidadEnEmision.estado}
                    etiqueta={
                      ETIQUETAS_ESTADO[unidadEnEmision.estado] ?? unidadEnEmision.estado
                    }
                  />
                  <StatusBadge
                    estado={compatibilidadEnEmision ?? "SIN_PRUEBA"}
                    etiqueta={textoCompatibilidadEnEmision}
                  />
                </div>
              </div>

              {compatibilidadEnEmision === "INCOMPATIBLE" && (
                <Banner tone="error">
                  La última prueba cruzada es INCOMPATIBLE. El servidor bloqueará la
                  emisión de esta unidad.
                </Banner>
              )}
              {!pruebaEnEmision && (
                <Banner tone="aviso">
                  {solicitudSeleccionada?.caracter === "EMERGENCIA"
                    ? "Solicitud de EMERGENCIA sin prueba cruzada: se emitirá con la leyenda normativa de compatibilidad no completada."
                    : "Esta unidad no tiene prueba cruzada registrada. Si confirmás, se emitirá con advertencia."}
                </Banner>
              )}

              <FormGrid columns={2}>
                <FormField
                  id={`responsable-${unidadEnEmision.id}`}
                  label="Responsable de la emisión (obligatorio)"
                >
                  <input
                    id={`responsable-${unidadEnEmision.id}`}
                    required
                    maxLength={120}
                    placeholder="Nombre y apellido del responsable"
                    value={responsable}
                    onChange={(evento) => setResponsable(evento.target.value)}
                  />
                </FormField>
                <FormField
                  id={`observaciones-${unidadEnEmision.id}`}
                  label="Observaciones (opcional)"
                >
                  <input
                    id={`observaciones-${unidadEnEmision.id}`}
                    maxLength={500}
                    placeholder="Ej.: Retira enfermería de sala 4"
                    value={observaciones}
                    onChange={(evento) => setObservaciones(evento.target.value)}
                  />
                </FormField>
              </FormGrid>
            </FormSection>
          )}

          <div className="ui-step-actions">
            {paso > 0 && (
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => setPaso(paso - 1)}
              >
                Anterior
              </button>
            )}
            <button
              type="submit"
              className="ui-btn ui-btn-primary"
              disabled={
                guardando ||
                (paso === 0 && !solicitudId) ||
                (paso === 1 && unidadEmitiendoId === null) ||
                (paso === 2 && !unidadEnEmision)
              }
            >
              {paso < PASOS.length - 1
                ? "Siguiente"
                : guardando
                  ? "Emitiendo…"
                  : "Confirmar emisión"}
            </button>
            {paso === PASOS.length - 1 && (
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => {
                  setUnidadEmitiendoId(null);
                  setPaso(1);
                }}
              >
                Volver
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="emision-no-imprimir">
        <ConfirmDialog
          open={confirmandoEmision}
          title="Confirmar emisión de sangre"
          description={
            <>
              <p>
                Se registrará la salida de la unidad{" "}
                <strong>{unidadEnEmision?.numeroUnidad ?? "—"}</strong> para{" "}
                <strong>{solicitudSeleccionada?.nombrePaciente ?? "—"}</strong> (DNI{" "}
                {solicitudSeleccionada?.dniPaciente ?? "—"}).
              </p>
              <p>
                Responsable de la emisión: <strong>{responsable.trim()}</strong>.
              </p>
            </>
          }
          confirmLabel="Confirmar emisión"
          cancelLabel="Cancelar"
          destructive
          busy={guardando}
          onCancel={() => setConfirmandoEmision(false)}
          onConfirm={() => {
            setConfirmandoEmision(false);
            void confirmarEmision();
          }}
        />
      </div>

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
              <div className="ui-row-actions">
                <button
                  type="button"
                  className="ui-btn ui-btn-small ui-btn-primary"
                  onClick={() => window.print()}
                >
                  Imprimir etiqueta
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn-small ui-btn-secondary"
                  onClick={() => setEtiquetaActiva(null)}
                >
                  Cerrar
                </button>
              </div>
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

          <Banner tone={etiquetaActiva.compatibilidadCompleta ? "ok" : "aviso"}>
            Compatibilidad: {etiquetaActiva.interpretacionCompatibilidad}
          </Banner>
        </section>
      )}

      {solicitudSeleccionada && (
        <section className="emision-panel">
          <h2>3. Emisiones registradas de esta solicitud</h2>
          {emisionesSolicitud.length === 0 ? (
            <EmptyState title="Todavía no se emitieron unidades para esta solicitud." />
          ) : (
            <DataTable
              rows={emisionesSolicitud}
              columns={columnasEmisiones}
              rowKey={(emision) => emision.id}
              searchText={textoBusquedaEmision}
              searchPlaceholder="Buscar por unidad, paciente, responsable o compatibilidad…"
              filters={[
                {
                  id: "compatibilidadEmisionesSolicitud",
                  label: "Compatibilidad",
                  value: filtroCompatibilidadEmisionesSolicitud,
                  options: OPCIONES_COMPATIBILIDAD_EMISION,
                  onChange: setFiltroCompatibilidadEmisionesSolicitud,
                },
                {
                  id: "anioEmisionesSolicitud",
                  label: "Año",
                  value: filtroAnioEmisionesSolicitud,
                  options: opcionesAnio(
                    emisionesSolicitud,
                    (emision) => emision.fechaHora,
                    filtroAnioEmisionesSolicitud,
                  ),
                  onChange: setFiltroAnioEmisionesSolicitud,
                },
              ]}
              filterRow={(emision) =>
                (!filtroCompatibilidadEmisionesSolicitud ||
                  (filtroCompatibilidadEmisionesSolicitud === "COMPLETA"
                    ? emision.compatibilidadCompleta
                    : !emision.compatibilidadCompleta)) &&
                (!filtroAnioEmisionesSolicitud ||
                  emision.fechaHora.startsWith(filtroAnioEmisionesSolicitud))
              }
              caption="Emisiones registradas de esta solicitud"
            />
          )}
        </section>
      )}

      <section className="emision-panel emision-no-imprimir">
        <FormSection title="Consultar historial de emisiones por unidad">
          <FormGrid columns={2}>
            <FormField id="emisionConsultaUnidad" label="Unidad de inventario">
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
            </FormField>
          </FormGrid>

          {cargandoHistorialUnidad && (
            <LoadingState label="Consultando historial de la unidad…" />
          )}

          {!cargandoHistorialUnidad && unidadConsultada && (
            <div className="emision-historial-unidad">
              <p className="emision-ayuda">
                Estado actual de <strong>{unidadConsultada.numeroUnidad}</strong>:{" "}
                <StatusBadge
                  estado={unidadConsultada.estado}
                  etiqueta={
                    ETIQUETAS_ESTADO[unidadConsultada.estado] ?? unidadConsultada.estado
                  }
                />
              </p>
              <DataTable
                rows={historialUnidad}
                columns={columnasHistorial}
                rowKey={(emision) => emision.id}
                searchText={textoBusquedaHistorial}
                searchPlaceholder="Buscar por solicitud, paciente, responsable o compatibilidad…"
                filters={[
                  {
                    id: "compatibilidadHistorial",
                    label: "Compatibilidad",
                    value: filtroCompatibilidadHistorial,
                    options: OPCIONES_COMPATIBILIDAD_EMISION,
                    onChange: setFiltroCompatibilidadHistorial,
                  },
                  {
                    id: "anioHistorial",
                    label: "Año",
                    value: filtroAnioHistorial,
                    options: opcionesAnio(
                      historialUnidad,
                      (emision) => emision.fechaHora,
                      filtroAnioHistorial,
                    ),
                    onChange: setFiltroAnioHistorial,
                  },
                ]}
                filterRow={(emision) =>
                  (!filtroCompatibilidadHistorial ||
                    (filtroCompatibilidadHistorial === "COMPLETA"
                      ? emision.compatibilidadCompleta
                      : !emision.compatibilidadCompleta)) &&
                  (!filtroAnioHistorial ||
                    emision.fechaHora.startsWith(filtroAnioHistorial))
                }
                emptyTitle="Esta unidad no tiene emisiones registradas."
                caption="Historial de emisiones de la unidad"
              />
            </div>
          )}
        </FormSection>
      </section>

      <section className="emision-panel emision-no-imprimir">
        <FormSection
          title="Todas las emisiones registradas"
          description="Consulta global de emisiones con búsqueda, filtros, orden y paginación."
        >
          {errorEmisionesGlobales ? (
            <Banner tone="error">
              {errorEmisionesGlobales}{" "}
              <button
                type="button"
                className="ui-btn ui-btn-small ui-btn-secondary"
                onClick={() => void recargarEmisionesGlobales()}
              >
                Reintentar
              </button>
            </Banner>
          ) : null}

          <DataTable
            rows={emisionesGlobales as EmisionRegistro[]}
            columns={columnasHistorial}
            rowKey={(emision) => emision.id}
            searchText={textoBusquedaHistorial}
            searchPlaceholder="Buscar por unidad, solicitud, paciente, responsable o compatibilidad…"
            filters={[
              {
                id: "compatibilidadEmisiones",
                label: "Compatibilidad",
                value: filtroCompatibilidadEmisiones,
                options: OPCIONES_COMPATIBILIDAD_EMISION,
                onChange: setFiltroCompatibilidadEmisiones,
              },
              {
                id: "anioGlobales",
                label: "Año",
                value: filtroAnioGlobales,
                options: opcionesAnio(
                  emisionesGlobales as EmisionRegistro[],
                  (emision) => emision.fechaHora,
                  filtroAnioGlobales,
                ),
                onChange: setFiltroAnioGlobales,
              },
            ]}
            filterRow={(emision) =>
              (!filtroCompatibilidadEmisiones ||
                (filtroCompatibilidadEmisiones === "COMPLETA"
                  ? emision.compatibilidadCompleta
                  : !emision.compatibilidadCompleta)) &&
              (!filtroAnioGlobales ||
                emision.fechaHora.startsWith(filtroAnioGlobales))
            }
            loading={cargandoEmisionesGlobales}
            emptyTitle="No hay emisiones registradas"
            emptyDescription="Las emisiones de sangre registradas aparecerán en este listado."
            caption="Emisiones de sangre registradas en el sistema."
          />
        </FormSection>
      </section>
    </section>
  );
}
