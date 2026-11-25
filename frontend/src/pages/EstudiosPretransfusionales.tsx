
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { FormSteps } from "../components/FormSteps";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { useEstudiosGlobales } from "../hooks/useDatos";
import type { EstudioGlobal } from "../types/datosGlobales";
import "../styles/EstudiosPretransfusionales.css";

const PASOS = [
  "Seleccionar solicitud",
  "Registrar estudio",
  "Historial y trazabilidad",
] as const;

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
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

function grupoReceptor(solicitud: Solicitud) {
  return `${solicitud.grupoABO}${solicitud.factorRhD === "POSITIVO" ? "+" : "-"}`;
}

function opcionesFiltro(
  valores: (string | null | undefined)[],
  todo = "Todos",
  etiquetas: Record<string, string> = {},
) {
  return [
    { value: "", label: todo },
    ...Array.from(
      new Set(valores.filter((valor): valor is string => Boolean(valor))),
    )
      .sort((a, b) => a.localeCompare(b, "es-AR"))
      .map((valor) => ({ value: valor, label: etiquetas[valor] ?? valor })),
  ];
}

const ETIQUETAS_ESTADO_SOLICITUD: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  CANCELADA: "Cancelada",
};

const ETIQUETAS_COMPATIBILIDAD: Record<string, string> = {
  COMPATIBLE: "Compatible",
  INCOMPATIBLE: "Incompatible",
};

const columnasSolicitudesPretrans: DataTableColumn<Solicitud>[] = [
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
    render: (solicitud) => grupoReceptor(solicitud),
    sortValue: (solicitud) =>
      `${solicitud.grupoABO}${solicitud.factorRhD}`,
  },
  {
    id: "componente",
    header: "Componente",
    render: (solicitud) => solicitud.tipoHemocomponente,
    sortValue: (solicitud) => solicitud.tipoHemocomponente,
  },
  {
    id: "estado",
    header: "Estado",
    render: (solicitud) => <StatusBadge estado={solicitud.estado} />,
    sortValue: (solicitud) => solicitud.estado,
  },
];

const columnasEstudiosGlobales: DataTableColumn<EstudioGlobal>[] = [
  {
    id: "solicitud",
    header: "Solicitud",
    render: (estudio) => <strong>#{estudio.solicitudId}</strong>,
    sortValue: (estudio) => estudio.solicitudId,
  },
  {
    id: "paciente",
    header: "Paciente",
    render: (estudio) =>
      estudio.solicitud?.nombrePaciente ?? "Sin paciente asociado",
    sortValue: (estudio) => estudio.solicitud?.nombrePaciente ?? "",
  },
  {
    id: "estudio",
    header: "Estudio",
    render: (estudio) => (
      <strong>
        {ETIQUETAS[estudio.tipo as TipoEstudio] ?? estudio.tipo}
      </strong>
    ),
    sortValue: (estudio) =>
      ETIQUETAS[estudio.tipo as TipoEstudio] ?? estudio.tipo,
  },
  {
    id: "fecha",
    header: "Fecha y hora",
    render: (estudio) => fechaArgentina(estudio.fechaHora),
    sortValue: (estudio) => estudio.fechaHora,
  },
  {
    id: "resultado",
    header: "Resultado",
    render: (estudio) => estudio.resultado,
    sortValue: (estudio) => estudio.resultado,
  },
  {
    id: "compatibilidad",
    header: "Compatibilidad",
    render: (estudio) =>
      estudio.compatibilidad ? (
        <StatusBadge estado={estudio.compatibilidad} />
      ) : (
        "—"
      ),
    sortValue: (estudio) => estudio.compatibilidad ?? "",
  },
  {
    id: "operador",
    header: "Operador",
    render: (estudio) => estudio.operador,
    sortValue: (estudio) => estudio.operador,
  },
];

const columnasEstudio: DataTableColumn<Estudio>[] = [
  {
    id: "estudio",
    header: "Estudio",
    render: (estudio) => <strong>{ETIQUETAS[estudio.tipo]}</strong>,
    sortValue: (estudio) => ETIQUETAS[estudio.tipo],
  },
  {
    id: "fecha",
    header: "Fecha y hora",
    render: (estudio) => fechaArgentina(estudio.fechaHora),
    sortValue: (estudio) => estudio.fechaHora,
  },
  {
    id: "resultado",
    header: "Resultado",
    render: (estudio) => estudio.resultado,
    sortValue: (estudio) => estudio.resultado,
  },
  {
    id: "unidad",
    header: "Unidad",
    render: (estudio) => estudio.unidadSangre?.numeroUnidad ?? "—",
    sortValue: (estudio) => estudio.unidadSangre?.numeroUnidad ?? "",
  },
  {
    id: "compatibilidad",
    header: "Compatibilidad",
    render: (estudio) =>
      estudio.compatibilidad ? (
        <StatusBadge
          estado={estudio.compatibilidad}
          etiqueta={
            estudio.compatibilidad === "COMPATIBLE"
              ? "Compatible"
              : "Incompatible"
          }
        />
      ) : (
        "—"
      ),
    sortValue: (estudio) => estudio.compatibilidad ?? "",
  },
  {
    id: "operador",
    header: "Operador",
    render: (estudio) => estudio.operador,
    sortValue: (estudio) => estudio.operador,
  },
  {
    id: "observaciones",
    header: "Observaciones",
    render: (estudio) => estudio.observaciones ?? "—",
    sortValue: (estudio) => estudio.observaciones ?? "",
  },
  {
    id: "alerta",
    header: "Alerta",
    render: (estudio) =>
      estudio.alerta ? <span role="alert">{estudio.alerta}</span> : "—",
    sortValue: (estudio) => estudio.alerta ?? "",
  },
];

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
  const [paso, setPaso] = useState(0);
  const [filtroTipoGlobal, setFiltroTipoGlobal] = useState("");
  const [filtroCompatibilidadGlobal, setFiltroCompatibilidadGlobal] =
    useState("");
  const [filtroUnidadGlobal, setFiltroUnidadGlobal] = useState("");
  const [filtroEstadoSolicitudes, setFiltroEstadoSolicitudes] =
    useState("");
  const [filtroComponenteSolicitudes, setFiltroComponenteSolicitudes] =
    useState("");
  const [filtroGrupoSolicitudes, setFiltroGrupoSolicitudes] =
    useState("");
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState("");
  const [filtroCompatibilidadHistorial, setFiltroCompatibilidadHistorial] =
    useState("");
  const [filtroUnidadHistorial, setFiltroUnidadHistorial] = useState("");
  const {
    datos: estudiosGlobales,
    cargando: cargandoEstudiosGlobales,
    error: errorEstudiosGlobales,
    recargar: recargarEstudiosGlobales,
  } = useEstudiosGlobales();

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

  const filtrosSolicitudes = [
    {
      id: "estadoSolicitudes",
      label: "Estado",
      value: filtroEstadoSolicitudes,
      options: opcionesFiltro(
        solicitudesActivas.map((solicitud) => solicitud.estado),
        "Todos",
        ETIQUETAS_ESTADO_SOLICITUD,
      ),
      onChange: setFiltroEstadoSolicitudes,
    },
    {
      id: "componenteSolicitudes",
      label: "Componente",
      value: filtroComponenteSolicitudes,
      options: opcionesFiltro(
        solicitudesActivas.map(
          (solicitud) => solicitud.tipoHemocomponente,
        ),
      ),
      onChange: setFiltroComponenteSolicitudes,
    },
    {
      id: "grupoSolicitudes",
      label: "Receptor",
      value: filtroGrupoSolicitudes,
      options: opcionesFiltro(
        solicitudesActivas.map((solicitud) =>
          grupoReceptor(solicitud),
        ),
      ),
      onChange: setFiltroGrupoSolicitudes,
    },
  ];

  const filtrosHistorial = [
    {
      id: "tipoHistorial",
      label: "Estudio",
      value: filtroTipoHistorial,
      options: [
        { value: "", label: "Todos" },
        ...Object.entries(ETIQUETAS)
          .filter(([valor]) =>
            estudios.some((estudio) => estudio.tipo === valor),
          )
          .map(([valor, etiqueta]) => ({
            value: valor,
            label: etiqueta,
          })),
      ],
      onChange: setFiltroTipoHistorial,
    },
    {
      id: "compatibilidadHistorial",
      label: "Compatibilidad",
      value: filtroCompatibilidadHistorial,
      options: opcionesFiltro(
        estudios.map((estudio) => estudio.compatibilidad),
        "Todas",
        ETIQUETAS_COMPATIBILIDAD,
      ),
      onChange: setFiltroCompatibilidadHistorial,
    },
    {
      id: "unidadHistorial",
      label: "Unidad",
      value: filtroUnidadHistorial,
      options: opcionesFiltro(
        estudios.map((estudio) => estudio.unidadSangre?.numeroUnidad),
      ),
      onChange: setFiltroUnidadHistorial,
    },
  ];

  const filtrosGlobales = [
    {
      id: "tipoGlobal",
      label: "Estudio",
      value: filtroTipoGlobal,
      options: [
        { value: "", label: "Todos" },
        ...Object.entries(ETIQUETAS)
          .filter(([valor]) =>
            estudiosGlobales.some((estudio) => estudio.tipo === valor),
          )
          .map(([valor, etiqueta]) => ({
            value: valor,
            label: etiqueta,
          })),
      ],
      onChange: setFiltroTipoGlobal,
    },
    {
      id: "compatibilidadGlobal",
      label: "Compatibilidad",
      value: filtroCompatibilidadGlobal,
      options: [
        ...opcionesFiltro(
          estudiosGlobales.map((estudio) => estudio.compatibilidad),
          "Todas",
          ETIQUETAS_COMPATIBILIDAD,
        ),
        ...(estudiosGlobales.some((estudio) => !estudio.compatibilidad)
          ? [{ value: "SIN_COMPATIBILIDAD", label: "Sin compatibilidad" }]
          : []),
      ],
      onChange: setFiltroCompatibilidadGlobal,
    },
    {
      id: "unidadGlobal",
      label: "Unidad",
      value: filtroUnidadGlobal,
      options: opcionesFiltro(
        estudiosGlobales.map(
          (estudio) => estudio.unidadSangre?.numeroUnidad,
        ),
      ),
      onChange: setFiltroUnidadGlobal,
    },
  ];

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
    setPaso(0);
    setBanner(null);
    setForm((actual) => ({
      ...formularioInicial,
      operador: actual.operador,
    }));
  }

  async function guardarEstudio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBanner(null);

    function enfocarPrimerError() {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("form [aria-invalid='true']")?.focus();
      });
    }

    if (!solicitudSeleccionada) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná una solicitud de transfusión.",
      });
      setPaso(0);
      document.getElementById("pretrans-solicitud")?.focus();
      return;
    }

    if (!form.tipo || !form.resultado.trim() || !form.operador.trim()) {
      setBanner({
        tipo: "error",
        texto: "Completá el tipo de estudio, resultado y operador.",
      });
      enfocarPrimerError();
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
      enfocarPrimerError();
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
      <PageHeader
        title="Estudios pretransfusionales"
        description="Registrá resultados, evaluá pruebas de compatibilidad y consultá su trazabilidad."
      />

      {banner ? (
        <Banner tone={banner.tipo === "alerta" ? "aviso" : banner.tipo}>
          {banner.texto}
        </Banner>
      ) : null}

      <FormSteps pasos={PASOS} actual={paso} />

      {paso === 0 && (
      <FormSection title="Seleccionar solicitud" description="Elegí la solicitud sobre la que vas a registrar los estudios.">
        {cargando ? (
          <LoadingState label="Cargando solicitudes…" />
        ) : (
          <FormField
            id="pretrans-solicitud"
            label="Solicitud de transfusión"
            required
            hint={
              solicitudesActivas.length === 0
                ? "No hay solicitudes activas con paciente asociado."
                : undefined
            }
          >
            <select
              id="pretrans-solicitud"
              value={solicitudId}
              onChange={(e) => cambiarSolicitud(e.target.value)}
              disabled={enviando}
              aria-invalid={Boolean(banner?.tipo === "error") && !solicitudId}
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
          </FormField>
        )}

        <DataTable
          rows={solicitudesActivas}
          columns={columnasSolicitudesPretrans}
          rowKey={(solicitud) => solicitud.id}
          searchText={(solicitud) =>
            `${solicitud.id} ${solicitud.nombrePaciente} ${solicitud.dniPaciente} ${solicitud.tipoHemocomponente} ${solicitud.estado}`
          }
          searchPlaceholder="Buscar por solicitud, paciente, DNI o componente…"
          filters={filtrosSolicitudes}
          filterRow={(solicitud) =>
            (!filtroEstadoSolicitudes ||
              solicitud.estado === filtroEstadoSolicitudes) &&
            (!filtroComponenteSolicitudes ||
              solicitud.tipoHemocomponente ===
                filtroComponenteSolicitudes) &&
            (!filtroGrupoSolicitudes ||
              grupoReceptor(solicitud) === filtroGrupoSolicitudes)
          }
          loading={cargando}
          emptyTitle="No hay solicitudes activas con paciente asociado"
          emptyDescription="Las solicitudes registradas aparecerán aquí para seleccionarlas."
          caption="Solicitudes activas disponibles para registrar estudios."
          onRowClick={(solicitud) => cambiarSolicitud(String(solicitud.id))}
        />

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
              <StatusBadge estado={solicitudSeleccionada.estado} />
            </span>
          </div>
        )}

        <div className="ui-step-actions">
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            disabled={!solicitudSeleccionada}
            onClick={() => {
              setPaso(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Siguiente: registrar estudio
          </button>
        </div>
      </FormSection>
      )}

      {paso === 1 && solicitudSeleccionada && (
        <>
          <FormSection title="Registrar estudio" description="El resultado debe provenir del estudio realizado.">

            <form onSubmit={guardarEstudio} noValidate>
              <FormGrid columns={2}>
                <FormField id="pretrans-tipo" label="Tipo de estudio" required>
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
                    aria-invalid={Boolean(banner?.tipo === "error") && !form.tipo}
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
                </FormField>

                <FormField id="pretrans-resultado" label="Resultado del estudio" required>
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
                    aria-invalid={Boolean(banner?.tipo === "error") && !form.resultado.trim()}
                  />
                </FormField>

                {form.tipo === "PRUEBA_CRUZADA" && (
                  <>
                    <FormField
                      id="pretrans-unidad"
                      label="Unidad de sangre"
                      required
                      hint={
                        unidadesElegibles.length === 0
                          ? "No hay unidades elegibles del tipo solicitado. Podés registrarlas desde Recepción de unidades."
                          : undefined
                      }
                    >
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
                        aria-invalid={Boolean(banner?.tipo === "error") && !form.unidadSangreId}
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
                    </FormField>

                    <FormField id="pretrans-compatibilidad" label="Compatibilidad" required>
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
                        aria-invalid={Boolean(banner?.tipo === "error") && !form.compatibilidad}
                      >
                        <option value="">Seleccioná</option>
                        <option value="COMPATIBLE">
                          Compatible
                        </option>
                        <option value="INCOMPATIBLE">
                          Incompatible
                        </option>
                      </select>
                    </FormField>
                  </>
                )}

                <FormField id="pretrans-operador" label="Operador" required>
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
                    aria-invalid={Boolean(banner?.tipo === "error") && !form.operador.trim()}
                  />
                </FormField>

                <FormField id="pretrans-observaciones" label="Observaciones" optional className="pretrans-ancho">
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
                </FormField>
              </FormGrid>

              <p className="pretrans-ayuda">
                El resultado informado debe provenir del estudio
                realizado. La aplicación no determina automáticamente
                la compatibilidad clínica ni autoriza transfusiones.
              </p>

              <div className="ui-step-actions">
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary"
                  onClick={() => {
                    setPaso(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary"
                  onClick={() => {
                    setPaso(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Siguiente: historial
                </button>
                <button
                  className="ui-btn ui-btn-primary"
                  type="submit"
                  disabled={enviando}
                >
                  {enviando
                    ? "Guardando..."
                    : "Registrar estudio"}
                </button>
              </div>
            </form>
          </FormSection>
        </>
      )}

      {paso === 2 && solicitudSeleccionada && (
        <FormSection
          title="Historial de estudios"
          description="Trazabilidad de los estudios registrados para la solicitud."
        >
          {cargandoHistorial ? (
            <LoadingState label="Cargando historial…" />
          ) : (
            <DataTable
              rows={estudios}
              columns={columnasEstudio}
              rowKey={(estudio) => estudio.id}
              searchText={(estudio) =>
                `${ETIQUETAS[estudio.tipo]} ${estudio.resultado} ${estudio.operador} ${estudio.unidadSangre?.numeroUnidad ?? ""} ${estudio.observaciones ?? ""}`
              }
              searchPlaceholder="Buscar en el historial…"
              filters={filtrosHistorial}
              filterRow={(estudio) =>
                (!filtroTipoHistorial ||
                  estudio.tipo === filtroTipoHistorial) &&
                (!filtroCompatibilidadHistorial ||
                  estudio.compatibilidad ===
                    filtroCompatibilidadHistorial) &&
                (!filtroUnidadHistorial ||
                  estudio.unidadSangre?.numeroUnidad ===
                    filtroUnidadHistorial)
              }
              emptyTitle="Sin estudios registrados"
              emptyDescription="Todavía no hay estudios registrados para esta solicitud."
              caption="Estudios pretransfusionales registrados para la solicitud."
            />
          )}

          <div className="ui-step-actions">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => {
                setPaso(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Anterior
            </button>
          </div>
        </FormSection>
      )}

      <FormSection
        title="Todos los estudios registrados"
        description="Consulta global de estudios pretransfusionales con búsqueda, filtros, orden y paginación."
      >
        {errorEstudiosGlobales ? (
          <Banner tone="error">
            {errorEstudiosGlobales}{" "}
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={() => void recargarEstudiosGlobales()}
            >
              Reintentar
            </button>
          </Banner>
        ) : null}

        <DataTable
          rows={estudiosGlobales}
          columns={columnasEstudiosGlobales}
          rowKey={(estudio) => estudio.id}
          searchText={(estudio) =>
            `${estudio.solicitudId} ${estudio.solicitud?.nombrePaciente ?? ""} ${estudio.solicitud?.dniPaciente ?? ""} ${ETIQUETAS[estudio.tipo as TipoEstudio] ?? estudio.tipo} ${estudio.resultado} ${estudio.operador}`
          }
          searchPlaceholder="Buscar por solicitud, paciente, estudio, resultado u operador…"
          filters={filtrosGlobales}
          filterRow={(estudio) => {
            const porTipo =
              !filtroTipoGlobal || estudio.tipo === filtroTipoGlobal;
            const porCompatibilidad =
              !filtroCompatibilidadGlobal ||
              (filtroCompatibilidadGlobal === "SIN_COMPATIBILIDAD"
                ? !estudio.compatibilidad
                : estudio.compatibilidad === filtroCompatibilidadGlobal);
            const porUnidad =
              !filtroUnidadGlobal ||
              estudio.unidadSangre?.numeroUnidad === filtroUnidadGlobal;
            return porTipo && porCompatibilidad && porUnidad;
          }}
          loading={cargandoEstudiosGlobales}
          emptyTitle="No hay estudios pretransfusionales registrados"
          emptyDescription="Los estudios registrados desde las solicitudes aparecerán en este listado."
          caption="Estudios pretransfusionales registrados en el sistema."
        />
      </FormSection>
    </section>
  );
}
