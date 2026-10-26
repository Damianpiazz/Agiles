import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { DeterminacionSerologica } from "../types/estudio";
import "../styles/TamizajeInfecciones.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
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
type Banner = { tipo: "ok" | "error" | "alerta"; texto: string } | null;
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
  const [donacionId, setDonacionId] = useState("");
  const [fecha, setFecha] = useState(fechaHoy);
  const [operador, setOperador] = useState("");
  const [determinaciones, setDeterminaciones] = useState<DeterminacionSerologica[]>([]);
  const [catalogosCargados, setCatalogosCargados] = useState(false);
  const [catalogosError, setCatalogosError] = useState("");
  const [resultados, setResultados] = useState(resultadosVacios);
  const [historial, setHistorial] = useState<ResultadoTamizaje[]>([]);
  const [historialConsultado, setHistorialConsultado] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
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
    const id = Number(donacionId);
    if (!Number.isInteger(id) || id <= 0 || !donacionId.trim()) {
      setBanner({ tipo: "error", texto: "Ingresá un ID de donación válido." });
      return null;
    }
    return id;
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
      return;
    }
    if (PRUEBAS.some((prueba) => !resultados[prueba.clave])) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná el resultado de las siete pruebas antes de guardar.",
      });
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
    <main className="tamizaje-container">
      <header className="tamizaje-header">
        <h1>Tamizaje de infecciones transmisibles</h1>
        <p>Registrá los resultados serológicos de una donación para evaluar si la unidad puede avanzar hacia su liberación.</p>
      </header>

      {banner && (
        <div className={`tamizaje-banner tamizaje-banner-${banner.tipo}`} role="status">
          {banner.texto}
        </div>
      )}

      {catalogosError && <p className="tamizaje-catalogo-error" role="alert">{catalogosError}</p>}
      {catalogosCargados && !pruebas && (
        <p className="tamizaje-catalogo-error" role="alert">
          El catálogo no tiene todas las pruebas de tamizaje requeridas. Actualizá el catálogo antes de registrar.
        </p>
      )}

      <section className="tamizaje-card">
        <h2>Datos del tamizaje</h2>
        <form className="tamizaje-form" onSubmit={registrar}>
          <div className="tamizaje-grid">
            <div className="tamizaje-field">
              <label htmlFor="tamizajeDonacionId">ID de la donación / unidad</label>
              <input
                id="tamizajeDonacionId"
                type="number"
                min="1"
                step="1"
                value={donacionId}
                onChange={(e) => setDonacionId(e.target.value)}
                placeholder="Ej.: 1"
                required
              />
            </div>
            <div className="tamizaje-field">
              <label htmlFor="tamizajeFecha">Fecha de determinación</label>
              <input
                id="tamizajeFecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="tamizaje-field">
              <label htmlFor="tamizajeOperador">Operador</label>
              <input
                id="tamizajeOperador"
                type="text"
                maxLength={120}
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                placeholder="Nombre del bioquímico o técnico"
                required
              />
            </div>
          </div>

          <div className="tamizaje-pruebas">
            <h3>Resultados de las pruebas</h3>
            {PRUEBAS.map((prueba) => (
              <div className="tamizaje-prueba" key={prueba.clave}>
                <span>{prueba.etiqueta}</span>
                <div className="tamizaje-opciones" role="group" aria-label={prueba.etiqueta}>
                  <label>
                    <input
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
                      type="radio"
                      name={prueba.clave}
                      value="REACTIVO"
                      checked={resultados[prueba.clave] === "REACTIVO"}
                      onChange={() => setResultados((actual) => ({ ...actual, [prueba.clave]: "REACTIVO" }))}
                    />
                    Reactivo
                  </label>
                </div>
              </div>
            ))}
          </div>

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
      </section>

      {historialConsultado && (
        <section className="tamizaje-card tamizaje-historial">
          <h2>Historial de la donación #{donacionId}</h2>
          {historial.length === 0 ? (
            <p>No hay tamizajes registrados para esta donación.</p>
          ) : (
            <div className="tamizaje-tabla-contenedor">
              <table className="tamizaje-tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Donante</th>
                    <th>Pruebas</th>
                    <th>Estado de la unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => {
                    const donante = item.donaciones[0]?.donacion?.donante;
                    const bloqueada = item.donaciones[0]?.donacion?.estado === "RECHAZADA";
                    return (
                      <tr key={item.id}>
                        <td>{new Date(item.fecha).toLocaleDateString("es-AR")}</td>
                        <td>{donante ? `${donante.apellido}, ${donante.nombre} (${donante.dni})` : "Donante asociado"}</td>
                        <td>
                          <ul className="tamizaje-lista-resultados">
                            {item.resultados.map((resultado) => (
                              <li key={`${item.id}-${resultado.determinacionSerologica.nombre}`}>
                                {resultado.determinacionSerologica.nombre}: {resultado.resultado}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>{bloqueada ? "Bloqueada para revisión" : "En calificación"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
