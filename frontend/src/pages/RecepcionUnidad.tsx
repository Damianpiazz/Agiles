import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import {
  obtenerFechaHoyArgentina,
  recepcionUnidadSchema,
  type RecepcionUnidadForm,
} from "../schemas/recepcionUnidad";
import "../styles/RecepcionUnidad.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type Campo = keyof RecepcionUnidadForm;
type FormState = Record<Campo, string>;
type Errores = Partial<Record<Campo, string[]>>;
type Banner = { tipo: "ok" | "error"; texto: string } | null;

type UnidadInventario = {
  id: number;
  numeroUnidad: string;
  tipoHemocomponente: string;
  grupoABO: "A" | "B" | "AB" | "O";
  factorRhD: "POSITIVO" | "NEGATIVO";
  fechaVencimiento: string;
  estado: string;
  operador: string;
  fechaRecepcion: string;
};

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
  VENCIDA: "VENCIDA",
  DADA_DE_BAJA: "Dada de baja",
};

const formInicial: FormState = {
  numeroUnidad: "",
  tipoHemocomponente: "",
  grupoABO: "",
  factorRhD: "",
  fechaVencimiento: "",
  estado: "DISPONIBLE",
  operador: "",
};

function formatearFechaVencimiento(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString("es-AR", {
    timeZone: "UTC",
  });
}

function formatearFechaHoraArgentina(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export default function RecepcionUnidad() {
  const [form, setForm] = useState<FormState>(formInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [enviando, setEnviando] = useState(false);
  const [unidades, setUnidades] = useState<UnidadInventario[]>([]);
  const [cargandoInventario, setCargandoInventario] = useState(true);

  const hoy = obtenerFechaHoyArgentina();

  async function cargarInventario() {
    try {
      const res = await fetch(`${API_URL}/api/inventario-unidades`);
      if (!res.ok) return;
      const data = (await res.json()) as UnidadInventario[];
      setUnidades(data);
    } catch {
      // Si falla la carga inicial del listado, el formulario sigue operativo.
    } finally {
      setCargandoInventario(false);
    }
  }

  useEffect(() => {
    void cargarInventario();
  }, []);

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function errorDe(campo: Campo) {
    return errores[campo]?.[0];
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);

    const parsed = recepcionUnidadSchema.safeParse(form);
    if (!parsed.success) {
      setErrores(z.flattenError(parsed.error).fieldErrors as Errores);
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/api/inventario-unidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 201) {
        const creada = (await res.json()) as UnidadInventario;
        setForm(formInicial);
        setBanner({
          tipo: "ok",
          texto: `Unidad ${creada.numeroUnidad} registrada en el inventario por ${creada.operador} (${formatearFechaHoraArgentina(creada.fechaRecepcion)}).`,
        });
        await cargarInventario();
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.campos) {
        setErrores(data.campos as Errores);
        setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
        return;
      }
      if (res.status === 409) {
        setBanner({
          tipo: "error",
          texto: data.error ?? "La unidad ya se encuentra registrada",
        });
        return;
      }
      setBanner({
        tipo: "error",
        texto: data.error ?? "No se pudo registrar la recepción de la unidad.",
      });
    } catch {
      setBanner({
        tipo: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="recepcion">
      <header className="recepcion-header">
        <h1>Registrar recepción de unidades</h1>
        <p>
          Incorporá unidades de hemocomponentes al inventario manteniendo su
          disponibilidad y trazabilidad.
        </p>
      </header>

      {banner && (
        <div
          className={`recepcion-banner ${banner.tipo === "ok" ? "recepcion-banner-ok" : "recepcion-banner-error"}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Datos de la unidad</legend>
          <div className="recepcion-grid">
            <div className="recepcion-field">
              <label htmlFor="numeroUnidad">Identificación de la unidad</label>
              <input
                id="numeroUnidad"
                name="numeroUnidad"
                placeholder="Ej.: U-1001"
                value={form.numeroUnidad}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("numeroUnidad"))}
              />
              {errorDe("numeroUnidad") && (
                <p className="recepcion-error">{errorDe("numeroUnidad")}</p>
              )}
            </div>

            <div className="recepcion-field">
              <label htmlFor="tipoHemocomponente">Tipo de hemocomponente</label>
              <select
                id="tipoHemocomponente"
                name="tipoHemocomponente"
                value={form.tipoHemocomponente}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("tipoHemocomponente"))}
              >
                <option value="">Seleccioná una opción</option>
                <option value="GLOBULOS_ROJOS">Glóbulos rojos</option>
                <option value="PLASMA">Plasma</option>
                <option value="PLAQUETAS">Plaquetas</option>
                <option value="CRIOPRECIPITADO">Crioprecipitado</option>
              </select>
              {errorDe("tipoHemocomponente") && (
                <p className="recepcion-error">
                  {errorDe("tipoHemocomponente")}
                </p>
              )}
            </div>

            <div className="recepcion-field">
              <label htmlFor="grupoABO">Grupo ABO</label>
              <select
                id="grupoABO"
                name="grupoABO"
                value={form.grupoABO}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("grupoABO"))}
              >
                <option value="">Seleccioná una opción</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
              {errorDe("grupoABO") && (
                <p className="recepcion-error">{errorDe("grupoABO")}</p>
              )}
            </div>

            <div className="recepcion-field">
              <label htmlFor="factorRhD">Factor RhD</label>
              <select
                id="factorRhD"
                name="factorRhD"
                value={form.factorRhD}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("factorRhD"))}
              >
                <option value="">Seleccioná una opción</option>
                <option value="POSITIVO">Positivo (+)</option>
                <option value="NEGATIVO">Negativo (-)</option>
              </select>
              {errorDe("factorRhD") && (
                <p className="recepcion-error">{errorDe("factorRhD")}</p>
              )}
            </div>

            <div className="recepcion-field">
              <label htmlFor="fechaVencimiento">Fecha de vencimiento</label>
              <input
                id="fechaVencimiento"
                name="fechaVencimiento"
                type="date"
                min={hoy}
                value={form.fechaVencimiento}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("fechaVencimiento"))}
              />
              {errorDe("fechaVencimiento") && (
                <p className="recepcion-error">{errorDe("fechaVencimiento")}</p>
              )}
            </div>

            <div className="recepcion-field">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("estado"))}
              >
                <option value="DISPONIBLE">Disponible</option>
              </select>
              {errorDe("estado") && (
                <p className="recepcion-error">{errorDe("estado")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Trazabilidad de la operación</legend>
          <div className="recepcion-grid">
            <div className="recepcion-field">
              <label htmlFor="operador">Operador responsable</label>
              <input
                id="operador"
                name="operador"
                placeholder="Nombre y apellido del operador"
                value={form.operador}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("operador"))}
              />
              {errorDe("operador") && (
                <p className="recepcion-error">{errorDe("operador")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="recepcion-actions">
          <button type="submit" disabled={enviando}>
            {enviando ? "Registrando…" : "Registrar recepción"}
          </button>
        </div>
      </form>

      <section className="recepcion-inventario">
        <h2>Unidades registradas en inventario</h2>
        {cargandoInventario ? (
          <p className="recepcion-vacio">Cargando inventario…</p>
        ) : unidades.length === 0 ? (
          <p className="recepcion-vacio">
            Todavía no hay unidades registradas en el inventario.
          </p>
        ) : (
          <div className="recepcion-tabla-contenedor">
            <table className="recepcion-tabla">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Hemocomponente</th>
                  <th>Grupo / Factor</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Operador</th>
                  <th>Fecha y hora de recepción</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => (
                  <tr key={u.id}>
                    <td>{u.numeroUnidad}</td>
                    <td>
                      {etiquetasHemocomponente[u.tipoHemocomponente] ??
                        u.tipoHemocomponente}
                    </td>
                    <td>
                      {u.grupoABO} {u.factorRhD === "POSITIVO" ? "+" : "-"}
                    </td>
                    <td>{formatearFechaVencimiento(u.fechaVencimiento)}</td>
                    <td>{etiquetasEstado[u.estado] ?? u.estado}</td>
                    <td>{u.operador || "—"}</td>
                    <td>{formatearFechaHoraArgentina(u.fechaRecepcion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
