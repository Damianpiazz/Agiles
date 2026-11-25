import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DonacionesTable } from "../components/DonacionesTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useDonaciones } from "../hooks/useDatos";
import type { DonacionResumen } from "../types/donacion";
import type { DeterminacionSerologica } from "../types/estudio";
import "../styles/TamizajeInfecciones.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

type PruebaKey =
  | "chagas"
  | "hbsag"
  | "antiHbc"
  | "antiHcv"
  | "antiHiv"
  | "treponema"
  | "htlv";
type EstadoResultado = "REACTIVO" | "NO_REACTIVO";
type SeleccionResultado = EstadoResultado | "";
type BannerMensaje = { tipo: "ok" | "error" | "alerta"; texto: string } | null;
type PruebaDefinicion = {
  clave: PruebaKey;
  etiqueta: string;
  alias: string[];
};
type ResultadoTamizaje = {
  id: number;
  fecha: string;
  estadoDonacion?: string;
  bloqueada?: boolean;
  pruebasReactivas?: string[];
  seroconversiones?: string[];
  resultados: {
    resultado: string;
    determinacionSerologica: { nombre: string };
  }[];
  donaciones: {
    donacionId: number;
    donacion?: {
      estado?: string;
      donante?: { nombre: string; apellido: string; dni: string };
    };
  }[];
};

const PRUEBAS: PruebaDefinicion[] = [
  { clave: "chagas", etiqueta: "Anti-T. cruzi (Chagas)", alias: ["anti-t. cruzi", "anti t cruzi", "chagas"] },
  { clave: "hbsag", etiqueta: "HBsAg", alias: ["hbsag"] },
  { clave: "antiHbc", etiqueta: "Anti-core HB (Anti-HBc)", alias: ["anti core hb", "anti-hbc"] },
  { clave: "antiHcv", etiqueta: "Anti-HCV", alias: ["anti-hcv"] },
  { clave: "antiHiv", etiqueta: "Anti-VIH 1/2", alias: ["anti vih 1/2", "anti-hiv"] },
  { clave: "treponema", etiqueta: "Anti-Treponema pallidum", alias: ["anti-treponema pallidum", "vdrl sifilis"] },
  { clave: "htlv", etiqueta: "Anti-HTLV I/II", alias: ["anti-htlv i/ii"] },
];

function etiquetaDonante(item: ResultadoTamizaje) {
  const donante = item.donaciones[0]?.donacion?.donante;
  return donante
    ? `${donante.apellido}, ${donante.nombre} (${donante.dni})`
    : "Donante asociado";
}

function etiquetaEstadoUnidad(item: ResultadoTamizaje) {
  return item.donaciones[0]?.donacion?.estado === "RECHAZADA"
    ? "Bloqueada para revisión"
    : "En calificación";
}

// El backend guarda "Reactivo"/"No reactivo", pero pueden aparecer variantes en mayúsculas.
function esReactivo(resultado: string) {
  return resultado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[_\s]+/g, " ")
    .trim() === "REACTIVO";
}

const columnasHistorial: DataTableColumn<ResultadoTamizaje>[] = [
  {
    id: "fecha",
    header: "Fecha",
    render: (item) => new Date(item.fecha).toLocaleDateString("es-AR"),
    sortValue: (item) => item.fecha,
  },
  {
    id: "donante",
    header: "Donante",
    render: (item) => etiquetaDonante(item),
    sortValue: (item) => etiquetaDonante(item),
  },
  {
    id: "pruebas",
    header: "Pruebas",
    render: (item) => (
      <ul className="tamizaje-lista-resultados">
        {item.resultados.map((resultado) => (
          <li key={`${item.id}-${resultado.determinacionSerologica.nombre}`}>
            {resultado.determinacionSerologica.nombre}: {resultado.resultado}
          </li>
        ))}
      </ul>
    ),
    sortValue: (item) =>
      item.resultados
        .map(
          (resultado) =>
            `${resultado.determinacionSerologica.nombre}: ${resultado.resultado}`,
        )
        .join(" | "),
  },
  {
    id: "estadoUnidad",
    header: "Estado de la unidad",
    render: (item) => (
      <StatusBadge
        estado={
          item.donaciones[0]?.donacion?.estado === "RECHAZADA"
            ? "BLOQUEADA"
            : "EN_CALIFICACION"
        }
        etiqueta={etiquetaEstadoUnidad(item)}
      />
    ),
    sortValue: (item) => etiquetaEstadoUnidad(item),
  },
];

function fechaHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function normalizarNombre(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();
}

function resultadosVacios(): Record<PruebaKey, SeleccionResultado> {
  return Object.fromEntries(
    PRUEBAS.map((prueba) => [prueba.clave, ""]),
  ) as Record<PruebaKey, SeleccionResultado>;
}

export default function TamizajeInfecciones() {
  const { datos: donaciones, cargando } = useDonaciones();
  const [seleccionada, setSeleccionada] = useState<DonacionResumen | null>(null);
  const [fecha, setFecha] = useState(fechaHoy);
  const [operador, setOperador] = useState("");
  const [determinaciones, setDeterminaciones] = useState<DeterminacionSerologica[]>([]);
  const [catalogosCargados, setCatalogosCargados] = useState(false);
  const [catalogosError, setCatalogosError] = useState("");
  const [resultados, setResultados] = useState(resultadosVacios);
  const [historial, setHistorial] = useState<ResultadoTamizaje[]>([]);
  const [filtroResultado, setFiltroResultado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [historialConsultado, setHistorialConsultado] = useState(false);
  const [banner, setBanner] = useState<BannerMensaje>(null);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarDeterminaciones() {
      try {
        const respuesta = await fetch(
          `${API_URL}/api/catalogos/determinaciones-serologicas`,
        );
        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok || !Array.isArray(datos)) {
          throw new Error("No se pudieron cargar las determinaciones.");
        }
        if (activo) {
          setDeterminaciones(datos as DeterminacionSerologica[]);
          setCatalogosCargados(true);
        }
      } catch {
        if (activo) setCatalogosError("No se pudieron cargar las pruebas de tamizaje.");
      }
    }

    cargarDeterminaciones();
    return () => {
      activo = false;
    };
  }, []);

  function obtenerPruebas() {
    const seleccionadas = PRUEBAS.map((prueba) => {
      const determinacion = prueba.alias
        .map((alias) =>
          determinaciones.find(
            (item) => normalizarNombre(alias) === normalizarNombre(item.nombre),
          ),
        )
        .find((item) => item !== undefined);
      return determinacion ? { ...prueba, determinacionId: determinacion.id } : null;
    });

    if (seleccionadas.some((prueba) => !prueba)) {
      return null;
    }

    return seleccionadas as (PruebaDefinicion & { determinacionId: number })[];
  }

  function obtenerIdDonacion() {
    if (!seleccionada) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná una donación de la tabla antes de continuar.",
      });
      document.getElementById("donacionesTamizaje")?.scrollIntoView({ behavior: "smooth" });
      return null;
    }
    return seleccionada.id;
  }

  function seleccionar(donacion: DonacionResumen) {
    setSeleccionada(donacion);
    setHistorial([]);
    setHistorialConsultado(false);
    setResultados(resultadosVacios());
    setBanner(null);
  }

  async function consultarHistorial() {
    setBanner(null);
    const id = obtenerIdDonacion();
    if (id === null) return;

    setConsultando(true);
    setHistorialConsultado(false);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/tamizajes-infecciones/donacion/${id}`,
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo consultar el historial.");
      }
      setHistorial(datos as ResultadoTamizaje[]);
      setHistorialConsultado(true);
      setBanner({
        tipo: "ok",
        texto: datos.length
          ? "Historial de tamizaje consultado correctamente."
          : "La donación todavía no tiene resultados de tamizaje registrados.",
      });
    } catch (error) {
      setBanner({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor.",
      });
    } finally {
      setConsultando(false);
    }
  }

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);

    const id = obtenerIdDonacion();
    if (id === null) return;
    const pruebas = obtenerPruebas();
    if (!pruebas) {
      setBanner({
        tipo: "error",
        texto: "Falta una o más pruebas de tamizaje en el catálogo del backend. Ejecutá el seed actualizado.",
      });
      return;
    }
    if (!fecha || !operador.trim()) {
      setBanner({ tipo: "error", texto: "Completá la fecha y el nombre del operador." });
      document.getElementById(!fecha ? "tamizajeFecha" : "tamizajeOperador")?.focus();
      return;
    }
    const pruebaPendiente = PRUEBAS.find((prueba) => !resultados[prueba.clave]);
    if (pruebaPendiente) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná el resultado de las siete pruebas antes de guardar.",
      });
      document.getElementById(`${pruebaPendiente.clave}-no-reactivo`)?.focus();
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/tamizajes-infecciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donacionId: id,
          fecha,
          operador: operador.trim(),
          resultados: pruebas.map((prueba) => ({
            determinacionSerologicaId: prueba.determinacionId,
            resultado: resultados[prueba.clave] as EstadoResultado,
          })),
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo registrar el tamizaje.");
      }

      if (datos.bloqueada) {
        if (datos.pruebasReactivas?.length) {
          const seroconversion = datos.seroconversiones?.length
            ? ` Posible seroconversión en: ${datos.seroconversiones.join(", ")}. Requiere revisión.`
            : " La unidad queda bloqueada y requiere revisión.";
          setBanner({
            tipo: "alerta",
            texto: `Resultado reactivo: ${datos.pruebasReactivas.join(", ")}.${seroconversion}`,
          });
        } else {
          setBanner({
            tipo: "alerta",
            texto: "La unidad continúa bloqueada hasta completar la revisión correspondiente.",
          });
        }
      } else {
        setBanner({
          tipo: "ok",
          texto: "Tamizaje registrado. La unidad queda como candidata a liberación, sujeta a los demás estudios de calificación.",
        });
      }

      setResultados(resultadosVacios());
      const respuestaHistorial = await fetch(
        `${API_URL}/api/tamizajes-infecciones/donacion/${id}`,
      );
      if (respuestaHistorial.ok) {
        setHistorial((await respuestaHistorial.json()) as ResultadoTamizaje[]);
        setHistorialConsultado(true);
      }
    } catch (error) {
      setBanner({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor.",
      });
    } finally {
      setGuardando(false);
    }
  }

  const pruebas = obtenerPruebas();

  return (
    <div className="tamizaje-container">
      <PageHeader
        title="Tamizaje de infecciones transmisibles"
        description="Registrá los resultados serológicos de una donación para evaluar si la unidad puede avanzar hacia su liberación."
      />

      {banner && (
        <Banner tone={banner.tipo === "error" ? "error" : banner.tipo === "alerta" ? "aviso" : "ok"}>
          {banner.texto}
        </Banner>
      )}

      {catalogosError && <Banner tone="error">{catalogosError}</Banner>}
      {catalogosCargados && !pruebas && (
        <Banner tone="error">
          El catálogo no tiene todas las pruebas de tamizaje requeridas. Actualizá el catálogo antes de registrar.
        </Banner>
      )}

      <section id="donacionesTamizaje" className="tamizaje-card" aria-labelledby="donacionesTamizajeTitulo">
        <h2 id="donacionesTamizajeTitulo">Donaciones registradas</h2>
        <DonacionesTable
          rows={donaciones}
          loading={cargando}
          selectedId={seleccionada?.id ?? null}
          onSeleccionar={seleccionar}
          actionLabel="Tamizar"
        />
        <p className="tamizaje-seleccion" aria-live="polite">
          {seleccionada ? (
            <>
              <strong>Donación #{seleccionada.id}</strong> · {seleccionada.donante.apellido},{" "}
              {seleccionada.donante.nombre} (DNI {seleccionada.donante.dni})
            </>
          ) : (
            "Seleccioná una donación de la tabla para continuar."
          )}
        </p>
      </section>

      <section className="tamizaje-card">
        <FormSection title="Datos del tamizaje">
          <form className="tamizaje-form" onSubmit={registrar}>
            <FormGrid columns={2}>
              <FormField id="tamizajeFecha" label="Fecha de determinación" required>
                <input
                  id="tamizajeFecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </FormField>
              <FormField id="tamizajeOperador" label="Operador" required>
                <input
                  id="tamizajeOperador"
                  type="text"
                  maxLength={120}
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  placeholder="Nombre del bioquímico o técnico"
                  required
                />
              </FormField>
            </FormGrid>

            <FormSection title="Resultados de las pruebas">
              <FormGrid columns={2}>
                {PRUEBAS.map((prueba) => (
                  <FormField
                    key={prueba.clave}
                    id={`${prueba.clave}-no-reactivo`}
                    label={prueba.etiqueta}
                    required
                  >
                    <div className="tamizaje-opciones" role="group" aria-label={prueba.etiqueta}>
                      <label>
                        <input
                          id={`${prueba.clave}-no-reactivo`}
                          type="radio"
                          name={prueba.clave}
                          value="NO_REACTIVO"
                          checked={resultados[prueba.clave] === "NO_REACTIVO"}
                          onChange={() => setResultados((actual) => ({ ...actual, [prueba.clave]: "NO_REACTIVO" }))}
                        />
                        No reactivo
                      </label>
                      <label>
                        <input
                          id={`${prueba.clave}-reactivo`}
                          type="radio"
                          name={prueba.clave}
                          value="REACTIVO"
                          checked={resultados[prueba.clave] === "REACTIVO"}
                          onChange={() => setResultados((actual) => ({ ...actual, [prueba.clave]: "REACTIVO" }))}
                        />
                        Reactivo
                      </label>
                    </div>
                  </FormField>
                ))}
              </FormGrid>
            </FormSection>

            <div className="tamizaje-actions">
              <button type="submit" disabled={guardando || !pruebas}>
                {guardando ? "Guardando..." : "Registrar tamizaje"}
              </button>
              <button
                type="button"
                className="tamizaje-button-secondary"
                onClick={consultarHistorial}
                disabled={consultando}
              >
                {consultando ? "Consultando..." : "Consultar historial"}
              </button>
            </div>
          </form>
        </FormSection>
      </section>

      {historialConsultado && (
        <section className="tamizaje-card tamizaje-historial">
          <h2>Historial de la donación #{seleccionada?.id ?? "—"}</h2>
          <DataTable
            rows={historial}
            columns={columnasHistorial}
            rowKey={(item) => item.id}
            searchText={(item) =>
              `${new Date(item.fecha).toLocaleDateString("es-AR")} ${etiquetaDonante(item)} ${item.resultados
                .map(
                  (resultado) =>
                    `${resultado.determinacionSerologica.nombre} ${resultado.resultado}`,
                )
                .join(" ")} ${etiquetaEstadoUnidad(item)}`
            }
            searchPlaceholder="Buscar en el historial…"
            filters={[
              {
                id: "resultado",
                label: "Resultado",
                value: filtroResultado,
                options: [
                  { value: "", label: "Todos los resultados" },
                  { value: "REACTIVO", label: "Reactivo" },
                  { value: "NO_REACTIVO", label: "No reactivo" },
                ],
                onChange: setFiltroResultado,
              },
              {
                id: "estado",
                label: "Estado",
                value: filtroEstado,
                options: [
                  { value: "", label: "Todos los estados" },
                  { value: "BLOQUEADA", label: "Bloqueada para revisión" },
                  { value: "EN_CALIFICACION", label: "En calificación" },
                ],
                onChange: setFiltroEstado,
              },
            ]}
            filterRow={(item) => {
              const hayReactivo = item.resultados.some((resultado) =>
                esReactivo(resultado.resultado),
              );
              const porResultado =
                !filtroResultado ||
                (filtroResultado === "REACTIVO" ? hayReactivo : !hayReactivo);
              const bloqueada =
                item.donaciones[0]?.donacion?.estado === "RECHAZADA";
              const porEstado =
                !filtroEstado ||
                (filtroEstado === "BLOQUEADA" ? bloqueada : !bloqueada);
              return porResultado && porEstado;
            }}
            loading={consultando}
            emptyTitle="Sin resultados"
            emptyDescription="No hay tamizajes registrados para esta donación."
            caption={`Historial de la donación #${seleccionada?.id ?? "—"}`}
          />
        </section>
      )}
    </div>
  );
}
