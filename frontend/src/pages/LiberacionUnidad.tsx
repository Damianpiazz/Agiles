import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import type { DataTableColumn } from "../components/DataTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { FormSteps } from "../components/FormSteps";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, LoadingState } from "../components/States";
import { useInventarioUnidades } from "../hooks/useDatos";
import type { UnidadInventario } from "../types/datosGlobales";
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

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

const PASOS = [
  "Identificación de la unidad",
  "Verificación de requisitos",
  "Confirmación y registro",
] as const;

type BannerState = { tono: "ok" | "error"; texto: string } | null;
type Estudio = { id: string; estudio: string; resultado: string };
type Novedad = { id: string; tipo: string; texto: string };
type RegistroDiscrepancia = {
  id: string;
  registro: string;
  grupoFactor: string;
};

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

function grupoFactor(unidad: UnidadInventario) {
  return `${unidad.grupoABO}${unidad.factorRhD === "POSITIVO" ? "+" : "-"}`;
}

const ETIQUETAS_ESTADO_UNIDAD: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  EMITIDA: "Emitida",
  BLOQUEADA: "Bloqueada",
  VENCIDA: "Vencida",
  DADA_DE_BAJA: "Dada de baja",
};

const columnasEstudios: DataTableColumn<Estudio>[] = [
  {
    id: "estudio",
    header: "Estudio",
    sortValue: (fila) => fila.estudio,
    render: (fila) => <strong>{fila.estudio}</strong>,
  },
  {
    id: "resultado",
    header: "Resultado",
    sortValue: (fila) => fila.resultado,
    render: (fila) => fila.resultado,
  },
];

const columnasNovedades: DataTableColumn<Novedad>[] = [
  {
    id: "tipo",
    header: "Tipo",
    sortValue: (fila) => fila.tipo,
    render: (fila) => <strong>{fila.tipo}</strong>,
  },
  {
    id: "texto",
    header: "Detalle",
    sortValue: (fila) => fila.texto,
    render: (fila) => fila.texto,
  },
];

const columnasDiscrepancia: DataTableColumn<RegistroDiscrepancia>[] = [
  {
    id: "registro",
    header: "Registro",
    sortValue: (fila) => fila.registro,
    render: (fila) => <strong>{fila.registro}</strong>,
  },
  {
    id: "grupoFactor",
    header: "Grupo / Factor",
    sortValue: (fila) => fila.grupoFactor,
    render: (fila) => fila.grupoFactor,
  },
];

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

  const [banner, setBanner] = useState<BannerState>(null);
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [confirmandoLiberacion, setConfirmandoLiberacion] =
    useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [filtroEstadoUnidades, setFiltroEstadoUnidades] = useState("");
  const [filtroComponenteUnidades, setFiltroComponenteUnidades] =
    useState("");
  const [filtroGrupoUnidades, setFiltroGrupoUnidades] = useState("");
  const [filtroEstudioCalificacion, setFiltroEstudioCalificacion] =
    useState("");
  const [filtroResultadoCalificacion, setFiltroResultadoCalificacion] =
    useState("");
  const [filtroTipoNovedad, setFiltroTipoNovedad] = useState("");
  const [filtroRegistroDiscrepancia, setFiltroRegistroDiscrepancia] =
    useState("");
  const [unidadBaja, setUnidadBaja] = useState<UnidadInventario | null>(null);
  const [motivoBaja, setMotivoBaja] = useState("");
  const [operadorBaja, setOperadorBaja] = useState("");
  const [erroresBaja, setErroresBaja] = useState<{
    motivo?: string;
    operador?: string;
  }>({});
  const [guardandoBaja, setGuardandoBaja] = useState(false);
  const {
    datos: unidades,
    cargando: cargandoUnidades,
    error: errorUnidades,
    recargar: recargarUnidades,
  } = useInventarioUnidades();

  function abrirBaja(unidad: UnidadInventario) {
    setUnidadBaja(unidad);
    setMotivoBaja("");
    setOperadorBaja("");
    setErroresBaja({});
  }

  async function ejecutarBajaUnidad() {
    if (!unidadBaja) return;

    const errores: { motivo?: string; operador?: string } = {};
    if (!motivoBaja) errores.motivo = "Seleccioná un motivo de baja.";
    if (!operadorBaja.trim()) {
      errores.operador = "Ingresá el operador responsable.";
    }
    if (errores.motivo || errores.operador) {
      setErroresBaja(errores);
      return;
    }

    setGuardandoBaja(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/inventario-unidades/${unidadBaja.id}/baja`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivo: motivoBaja,
            operador: operadorBaja.trim(),
          }),
        },
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error ?? "No se pudo dar de baja la unidad.");
      }
      setBanner({
        tono: "ok",
        texto: `Unidad ${datos.numeroUnidad} dada de baja por ${datos.operadorBaja}.`,
      });
      setUnidadBaja(null);
      await recargarUnidades();
    } catch (error) {
      setBanner({
        tono: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.",
      });
    } finally {
      setGuardandoBaja(false);
    }
  }

  function enfocarCampo(id: string) {
    const pasosPorCampo: Record<string, number> = {
      donacionId: 0,
      usuario: 0,
      observacionDiscrepancia: 1,
      motivo: 2,
    };
    const pasoDelCampo = pasosPorCampo[id];
    if (pasoDelCampo !== undefined && pasoDelCampo !== paso) {
      setPaso(pasoDelCampo);
    }
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
    });
  }

  async function evaluar() {
    if (!donacionId) {
      setBanner({
        tono: "error",
        texto: "Ingresá el ID de la donación.",
      });
      enfocarCampo("donacionId");
      return;
    }

    // Conserva el mensaje de éxito de una liberación/bloqueo reciente.
    setBanner((prev) => (prev?.tono === "ok" ? prev : null));
    setEnviando(true);

    try {
      const response = await fetch(
        `${API_URL}/api/unidades/${donacionId}/evaluacion`,
      );

      const data = await response.json();

      if (!response.ok) {
        setBanner({
          tono: "error",
          texto: data.error ?? "No se pudo evaluar la unidad.",
        });
        setEvaluacion(null);
        return;
      }

      setEvaluacion(data);
    } catch {
      setBanner({
        tono: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(
    accion: "LIBERAR" | "BLOQUEAR",
  ) {
    if (!usuario.trim()) {
      setBanner({
        tono: "error",
        texto: "Ingresá el usuario u operador.",
      });
      enfocarCampo("usuario");
      return;
    }

    if (accion === "BLOQUEAR" && !motivo.trim()) {
      setBanner({
        tono: "error",
        texto: "Ingresá el motivo del bloqueo.",
      });
      enfocarCampo("motivo");
      return;
    }

    if (
      resolverDiscrepancia &&
      !observacionDiscrepancia.trim()
    ) {
      setBanner({
        tono: "error",
        texto: "Documentá cómo se resolvió la discrepancia.",
      });
      enfocarCampo("observacionDiscrepancia");
      return;
    }

    setBanner(null);
    setEnviando(true);

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
        setBanner({
          tono: "error",
          texto:
            data.error ??
              "No se pudo actualizar la unidad.",
        });
        return;
      }

      setBanner({
        tono: "ok",
        texto: `Unidad ${data.estadoUnidad.toLowerCase()} correctamente.`,
      });

      await evaluar();
    } catch {
      setBanner({
        tono: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviando(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (paso < PASOS.length - 1) {
      setPaso(paso + 1);
      return;
    }

    setConfirmandoLiberacion(true);
  }

  const estudios: Estudio[] = evaluacion
    ? [
        {
          id: "aboRh",
          estudio: "ABO/RhD",
          resultado: evaluacion.estudios.tipificacion
            ? `${evaluacion.estudios.tipificacion.grupoABO} / ${evaluacion.estudios.tipificacion.factorRhD}`
            : "Pendiente",
        },
        {
          id: "tamizaje",
          estudio: "Tamizaje ITT",
          resultado: !evaluacion.estudios.tamizaje.cargado
            ? "Pendiente"
            : evaluacion.estudios.tamizaje
                  .pruebasReactivas.length === 0
              ? "No reactivo"
              : `Reactivo: ${evaluacion.estudios.tamizaje.pruebasReactivas.join(", ")}`,
        },
        {
          id: "anticuerpos",
          estudio: "Anticuerpos irregulares",
          resultado:
            evaluacion.estudios.anticuerposIrregulares
              .resultado ?? "Pendiente",
        },
      ]
    : [];

  const novedades: Novedad[] = evaluacion
    ? [
        ...evaluacion.faltantes.map((texto, indice) => ({
          id: `faltante-${indice}`,
          tipo: "Estudios pendientes:",
          texto,
        })),
        ...evaluacion.motivosBloqueo.map((texto, indice) => ({
          id: `bloqueo-${indice}`,
          tipo: "Motivo de bloqueo",
          texto,
        })),
        ...evaluacion.advertencias.map((texto, indice) => ({
          id: `advertencia-${indice}`,
          tipo: "Advertencia",
          texto,
        })),
      ]
    : [];

  const registrosDiscrepancia: RegistroDiscrepancia[] =
    evaluacion?.discrepancia.detectada
      ? [
          {
            id: "anterior",
            registro: "Registro anterior",
            grupoFactor: evaluacion.discrepancia.anterior
              ? `${evaluacion.discrepancia.anterior.grupoABO} / ${evaluacion.discrepancia.anterior.factorRhD}`
              : "-",
          },
          {
            id: "actual",
            registro: "Registro actual",
            grupoFactor: evaluacion.discrepancia.actual
              ? `${evaluacion.discrepancia.actual.grupoABO} / ${evaluacion.discrepancia.actual.factorRhD}`
              : "-",
          },
        ]
      : [];

  const filtrosUnidades = [
    {
      id: "estadoUnidades",
      label: "Estado",
      value: filtroEstadoUnidades,
      options: opcionesFiltro(
        unidades.map((unidad) => unidad.estado),
        "Todos",
        ETIQUETAS_ESTADO_UNIDAD,
      ),
      onChange: setFiltroEstadoUnidades,
    },
    {
      id: "componenteUnidades",
      label: "Hemocomponente",
      value: filtroComponenteUnidades,
      options: opcionesFiltro(
        unidades.map((unidad) => unidad.tipoHemocomponente),
      ),
      onChange: setFiltroComponenteUnidades,
    },
    {
      id: "grupoUnidades",
      label: "Grupo / Factor",
      value: filtroGrupoUnidades,
      options: opcionesFiltro(
        unidades.map((unidad) => grupoFactor(unidad)),
      ),
      onChange: setFiltroGrupoUnidades,
    },
  ];

  const filtrosCalificacion = [
    {
      id: "estudioCalificacion",
      label: "Estudio",
      value: filtroEstudioCalificacion,
      options: opcionesFiltro(estudios.map((fila) => fila.estudio)),
      onChange: setFiltroEstudioCalificacion,
    },
    {
      id: "resultadoCalificacion",
      label: "Resultado",
      value: filtroResultadoCalificacion,
      options: opcionesFiltro(estudios.map((fila) => fila.resultado)),
      onChange: setFiltroResultadoCalificacion,
    },
  ];

  const filtrosNovedades = [
    {
      id: "tipoNovedad",
      label: "Tipo",
      value: filtroTipoNovedad,
      options: opcionesFiltro(novedades.map((fila) => fila.tipo)),
      onChange: setFiltroTipoNovedad,
    },
  ];

  const filtrosDiscrepancia = [
    {
      id: "registroDiscrepancia",
      label: "Registro",
      value: filtroRegistroDiscrepancia,
      options: opcionesFiltro(
        registrosDiscrepancia.map((fila) => fila.registro),
      ),
      onChange: setFiltroRegistroDiscrepancia,
    },
  ];

  const columnasUnidades = useMemo<DataTableColumn<UnidadInventario>[]>(
    () => [
      {
        id: "numeroUnidad",
        header: "Unidad",
        sortValue: (unidad) => unidad.numeroUnidad,
        render: (unidad) => <strong>{unidad.numeroUnidad}</strong>,
      },
      {
        id: "tipo",
        header: "Hemocomponente",
        sortValue: (unidad) => unidad.tipoHemocomponente,
        render: (unidad) => unidad.tipoHemocomponente,
      },
      {
        id: "grupo",
        header: "Grupo / Factor",
        sortValue: (unidad) => `${unidad.grupoABO}${unidad.factorRhD}`,
        render: (unidad) => grupoFactor(unidad),
      },
      {
        id: "vencimiento",
        header: "Vencimiento",
        sortValue: (unidad) => unidad.fechaVencimiento,
        render: (unidad) =>
          new Date(unidad.fechaVencimiento).toLocaleDateString("es-AR", {
            timeZone: "UTC",
          }),
      },
      {
        id: "estado",
        header: "Estado",
        sortValue: (unidad) => unidad.estado,
        render: (unidad) => <StatusBadge estado={unidad.estado} />,
      },
      {
        id: "motivoBaja",
        header: "Motivo de baja",
        sortValue: (unidad) => unidad.motivoBaja ?? "",
        render: (unidad) => unidad.motivoBaja ?? "—",
      },
      {
        id: "acciones",
        header: "Acciones",
        className: "ui-col-acciones",
        render: (unidad) => (
          <div className="ui-row-actions">
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-danger"
              disabled={unidad.estado === "DADA_DE_BAJA"}
              onClick={() => abrirBaja(unidad)}
            >
              Dar de baja
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="liberacion">
      <PageHeader
        title="Liberar / bloquear unidad"
        description="Evaluá los resultados de calificación antes de habilitar una unidad para transfusión."
      />

      {banner ? <Banner tone={banner.tono}>{banner.texto}</Banner> : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate>
        <FormSteps pasos={PASOS} actual={paso} />

        {paso === 0 && (
          <section className="liberacion-card">
            <FormSection
              title="Identificación de la unidad"
              description="Ingresá la donación a evaluar y quién realiza la operación."
            >
              <FormGrid>
                <FormField
                  id="donacionId"
                  label="ID de la donación"
                  required
                >
                  <input
                    id="donacionId"
                    type="number"
                    min="1"
                    value={donacionId}
                    onChange={(e) =>
                      setDonacionId(e.target.value)
                    }
                  />
                </FormField>

                <FormField
                  id="usuario"
                  label="Usuario / operador"
                  required
                >
                  <input
                    id="usuario"
                    value={usuario}
                    onChange={(e) =>
                      setUsuario(e.target.value)
                    }
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <button
              type="button"
              onClick={evaluar}
              disabled={enviando}
            >
              {enviando ? "Evaluando..." : "Evaluar unidad"}
            </button>

            {enviando && !evaluacion ? (
              <LoadingState label="Evaluando unidad…" />
            ) : null}

            {evaluacion ? (
              <FormSection title="Unidad evaluada">
                <p>
                  <strong>
                    {evaluacion.donante.nombre}{" "}
                    {evaluacion.donante.apellido}
                  </strong>
                </p>

                <p>DNI: {evaluacion.donante.dni}</p>

                <p>
                  <strong>Estado de la unidad:</strong>{" "}
                  <StatusBadge estado={evaluacion.estadoUnidad} />
                </p>
              </FormSection>
            ) : null}
          </section>
        )}

        {paso === 1 && (
          <section className="liberacion-card">
            {evaluacion ? (
              <>
                <FormSection title="Resultados de calificación">
                  <DataTable
                    rows={estudios}
                    columns={columnasEstudios}
                    rowKey={(fila) => fila.id}
                    searchText={(fila) =>
                      `${fila.estudio} ${fila.resultado}`
                    }
                    searchPlaceholder="Buscar por estudio o resultado…"
                    filters={filtrosCalificacion}
                    filterRow={(fila) =>
                      (!filtroEstudioCalificacion ||
                        fila.estudio === filtroEstudioCalificacion) &&
                      (!filtroResultadoCalificacion ||
                        fila.resultado === filtroResultadoCalificacion)
                    }
                    emptyTitle="No hay resultados de calificación"
                    caption="Resultados de calificación de la unidad"
                  />
                </FormSection>

                <FormSection title="Novedades de la evaluación">
                  <DataTable
                    rows={novedades}
                    columns={columnasNovedades}
                    rowKey={(fila) => fila.id}
                    searchText={(fila) =>
                      `${fila.tipo} ${fila.texto}`
                    }
                    searchPlaceholder="Buscar por tipo o detalle…"
                    filters={filtrosNovedades}
                    filterRow={(fila) =>
                      !filtroTipoNovedad || fila.tipo === filtroTipoNovedad
                    }
                    emptyTitle="Sin estudios pendientes, bloqueos ni advertencias"
                    caption="Estudios pendientes, motivos de bloqueo y advertencias"
                  />
                </FormSection>

                {evaluacion.discrepancia.detectada && (
                  <FormSection title="Se detectó una discrepancia ABO/RhD">
                    <DataTable
                      rows={registrosDiscrepancia}
                      columns={columnasDiscrepancia}
                      rowKey={(fila) => fila.id}
                      searchText={(fila) =>
                        `${fila.registro} ${fila.grupoFactor}`
                      }
                      searchPlaceholder="Buscar por registro o grupo/factor…"
                      filters={filtrosDiscrepancia}
                      filterRow={(fila) =>
                        !filtroRegistroDiscrepancia ||
                        fila.registro === filtroRegistroDiscrepancia
                      }
                      caption="Registros de la discrepancia ABO/RhD"
                    />

                    {evaluacion.discrepancia.pendiente && (
                      <>
                        <label
                          className="check-row"
                          htmlFor="resolverDiscrepancia"
                        >
                          <input
                            id="resolverDiscrepancia"
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
                          <FormField
                            id="observacionDiscrepancia"
                            label="Documentación de la discrepancia"
                            required
                          >
                            <textarea
                              id="observacionDiscrepancia"
                              placeholder="Documentar cómo se resolvió la discrepancia..."
                              value={observacionDiscrepancia}
                              onChange={(e) =>
                                setObservacionDiscrepancia(
                                  e.target.value,
                                )
                              }
                            />
                          </FormField>
                        )}
                      </>
                    )}
                  </FormSection>
                )}
              </>
            ) : (
              <EmptyState
                title="No hay una evaluación cargada"
                description="Evaluá la unidad en la identificación para verificar los requisitos."
                action={
                  <button
                    type="button"
                    onClick={() => setPaso(0)}
                  >
                    Volver a identificación
                  </button>
                }
              />
            )}
          </section>
        )}

        {paso === 2 && (
          <section className="liberacion-card">
            {evaluacion ? (
              <>
                <FormSection
                  title="Confirmación y registro"
                  description="Revisá la unidad antes de registrar la operación."
                >
                  <p>
                    <strong>
                      {evaluacion.donante.nombre}{" "}
                      {evaluacion.donante.apellido}
                    </strong>
                  </p>

                  <p>DNI: {evaluacion.donante.dni}</p>

                  <p>
                    <strong>Estado de la unidad:</strong>{" "}
                    <StatusBadge estado={evaluacion.estadoUnidad} />
                  </p>
                </FormSection>

                <FormSection title="Motivo de bloqueo">
                  <FormField
                    id="motivo"
                    label="Motivo de bloqueo"
                    optional
                    hint="Obligatorio sólo para bloqueo manual"
                  >
                    <textarea
                      id="motivo"
                      placeholder="Obligatorio sólo para bloqueo manual"
                      value={motivo}
                      onChange={(e) =>
                        setMotivo(e.target.value)
                      }
                    />
                  </FormField>
                </FormSection>
              </>
            ) : (
              <EmptyState
                title="No hay una evaluación cargada"
                description="Evaluá la unidad en la identificación antes de registrar una operación."
                action={
                  <button
                    type="button"
                    onClick={() => setPaso(0)}
                  >
                    Volver a identificación
                  </button>
                }
              />
            )}
          </section>
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

          {paso === PASOS.length - 1 && evaluacion && (
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => void cambiarEstado("BLOQUEAR")}
              disabled={enviando}
            >
              Bloquear unidad
            </button>
          )}

          <button
            type="submit"
            className="ui-btn ui-btn-primary"
            disabled={enviando || (paso === PASOS.length - 1 && !evaluacion)}
          >
            {paso < PASOS.length - 1
              ? "Siguiente"
              : "Liberar unidad"}
          </button>
        </div>
      </form>

      <FormSection
        title="Unidades del inventario"
        description="Buscá una unidad registrada y registrá su baja definitiva cuando corresponda."
      >
        {errorUnidades ? (
          <Banner tone="error">
            {errorUnidades}{" "}
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={() => void recargarUnidades()}
            >
              Reintentar
            </button>
          </Banner>
        ) : null}

        <DataTable
          rows={unidades}
          columns={columnasUnidades}
          rowKey={(unidad) => unidad.id}
          searchText={(unidad) =>
            `${unidad.numeroUnidad} ${unidad.tipoHemocomponente} ${unidad.grupoABO} ${unidad.factorRhD} ${unidad.estado} ${unidad.motivoBaja ?? ""}`
          }
          searchPlaceholder="Buscar por unidad, componente, grupo, estado o motivo de baja…"
          filters={filtrosUnidades}
          filterRow={(unidad) =>
            (!filtroEstadoUnidades ||
              unidad.estado === filtroEstadoUnidades) &&
            (!filtroComponenteUnidades ||
              unidad.tipoHemocomponente === filtroComponenteUnidades) &&
            (!filtroGrupoUnidades ||
              grupoFactor(unidad) === filtroGrupoUnidades)
          }
          loading={cargandoUnidades}
          emptyTitle="No hay unidades en el inventario"
          emptyDescription="Las unidades registradas desde Recepción aparecerán en este listado."
          caption="Unidades del inventario con búsqueda, filtros, orden y paginación."
        />
      </FormSection>

      <ConfirmDialog
        open={confirmandoLiberacion}
        title="Confirmar liberación de unidad"
        description={
          evaluacion ? (
            <>
              <p>
                Se liberará la unidad de{" "}
                <strong>
                  {evaluacion.donante.nombre}{" "}
                  {evaluacion.donante.apellido}
                </strong>{" "}
                (DNI: {evaluacion.donante.dni}).
              </p>
              <p>
                Estado actual:{" "}
                <strong>{evaluacion.estadoUnidad}</strong>.
              </p>
            </>
          ) : (
            <p>Se liberará la unidad evaluada.</p>
          )
        }
        confirmLabel="Liberar unidad"
        cancelLabel="Cancelar"
        destructive={false}
        busy={enviando}
        onConfirm={() => {
          setConfirmandoLiberacion(false);
          void cambiarEstado("LIBERAR");
        }}
        onCancel={() => setConfirmandoLiberacion(false)}
      />

      <ConfirmDialog
        open={unidadBaja !== null}
        title="Confirmar baja de unidad"
        description={
          <>
            <p>
              Se dará de baja la unidad{" "}
              <strong>{unidadBaja?.numeroUnidad ?? "—"}</strong>. La operación
              es definitiva y quedará registrada.
            </p>
            <label htmlFor="motivoBajaUnidad">Motivo de la baja</label>
            <select
              id="motivoBajaUnidad"
              value={motivoBaja}
              aria-invalid={Boolean(erroresBaja.motivo)}
              onChange={(evento) => {
                setMotivoBaja(evento.target.value);
                setErroresBaja((actual) => ({ ...actual, motivo: undefined }));
              }}
            >
              <option value="">Seleccioná un motivo</option>
              {unidadBaja?.estado !== "EMITIDA" && (
                <option value="VENCIDA">Vencida</option>
              )}
              <option value="TRANSFUNDIDA">Transfundida</option>
              <option value="DESCARTADA">Descartada</option>
            </select>
            {erroresBaja.motivo ? (
              <p className="ui-field-error" role="alert">
                {erroresBaja.motivo}
              </p>
            ) : null}

            <label htmlFor="operadorBajaUnidad">Operador responsable</label>
            <input
              id="operadorBajaUnidad"
              value={operadorBaja}
              aria-invalid={Boolean(erroresBaja.operador)}
              onChange={(evento) => {
                setOperadorBaja(evento.target.value);
                setErroresBaja((actual) => ({
                  ...actual,
                  operador: undefined,
                }));
              }}
            />
            {erroresBaja.operador ? (
              <p className="ui-field-error" role="alert">
                {erroresBaja.operador}
              </p>
            ) : null}
          </>
        }
        confirmLabel="Confirmar baja"
        cancelLabel="Cancelar"
        destructive
        busy={guardandoBaja}
        onConfirm={() => void ejecutarBajaUnidad()}
        onCancel={() => setUnidadBaja(null)}
      />
    </div>
  );
}
