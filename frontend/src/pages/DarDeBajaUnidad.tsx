import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import {
  bajaUnidadSchema,
  type BajaUnidadForm,
} from "../schemas/bajaUnidad";
import "../styles/DarDeBajaUnidad.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type Campo = keyof BajaUnidadForm;
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
  motivoBaja: string | null;
  operadorBaja: string | null;
  fechaBaja: string | null;
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
  EMITIDA: "Emitida",
  BLOQUEADA: "Bloqueada",
  VENCIDA: "Vencida",
  DADA_DE_BAJA: "Dada de baja",
};

const etiquetasMotivoBaja: Record<string, string> = {
  VENCIDA: "Vencida",
  TRANSFUNDIDA: "Transfundida",
  DESCARTADA: "Descartada",
};

const formInicial: FormState = {
  unidadId: "",
  motivo: "",
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

export default function DarDeBajaUnidad() {
  const [form, setForm] = useState<FormState>(formInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [enviando, setEnviando] = useState(false);
  const [unidades, setUnidades] = useState<UnidadInventario[]>([]);
  const [cargandoInventario, setCargandoInventario] = useState(true);

  const unidadesElegibles = unidades.filter(
    (u) => u.estado !== "DADA_DE_BAJA",
  );
  const unidadSeleccionada = unidades.find(
    (u) => String(u.id) === form.unidadId,
  );
  const esUnidadEmitida = unidadSeleccionada?.estado === "EMITIDA";

  async function cargarInventario() {
    try {
      const res = await fetch(`${API_URL}/api/inventario-unidades`);
      if (!res.ok) return;
      const data = (await res.json()) as UnidadInventario[];
      setUnidades(data);
    } catch {
      // Si falla la carga del listado, el formulario sigue operativo.
    } finally {
      setCargandoInventario(false);
    }
  }

  useEffect(() => {
    void cargarInventario();
  }, []);

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "unidadId") {
        const elegida = unidades.find((u) => String(u.id) === value);
        const motivoLimpio =
          elegida?.estado === "EMITIDA" && prev.motivo === "VENCIDA"
            ? ""
            : prev.motivo;
        return { ...prev, unidadId: value, motivo: motivoLimpio };
      }
      return { ...prev, [name]: value };
    });
  }

  function errorDe(campo: Campo) {
    return errores[campo]?.[0];
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);

    const parsed = bajaUnidadSchema.safeParse(form);
    if (!parsed.success) {
      setErrores(z.flattenError(parsed.error).fieldErrors as Errores);
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const { unidadId, motivo, operador } = parsed.data;
      const res = await fetch(
        `${API_URL}/api/inventario-unidades/${unidadId}/baja`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo, operador }),
        },
      );

      if (res.status === 200) {
        const dada = (await res.json()) as UnidadInventario;
        setForm(formInicial);
        setBanner({
          tipo: "ok",
          texto: `Unidad ${dada.numeroUnidad} dada de baja por ${dada.operadorBaja} (${etiquetasMotivoBaja[dada.motivoBaja ?? ""] ?? dada.motivoBaja}) el ${formatearFechaHoraArgentina(dada.fechaBaja ?? "")}.`,
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
      setBanner({
        tipo: "error",
        texto: data.error ?? "No se pudo dar de baja la unidad.",
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
    <main className="baja">
      <header className="baja-header">
        <h1>Dar de baja unidad</h1>
        <p>
          Registrá la disposición final de una unidad de hemocomponente para
          que deje de estar disponible en el inventario, conservando su
          trazabilidad.
        </p>
      </header>

      {banner && (
        <div
          className={`baja-banner ${banner.tipo === "ok" ? "baja-banner-ok" : "baja-banner-error"}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Datos de la baja</legend>
          <div className="baja-grid">
            <div className="baja-field">
              <label htmlFor="unidadId">Unidad</label>
              <select
                id="unidadId"
                name="unidadId"
                value={form.unidadId}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("unidadId"))}
              >
                <option value="">Seleccioná una unidad</option>
                {unidadesElegibles.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.numeroUnidad} ·{" "}
                    {etiquetasHemocomponente[u.tipoHemocomponente] ??
                      u.tipoHemocomponente}{" "}
                    {u.grupoABO}
                    {u.factorRhD === "POSITIVO" ? "+" : "-"} (
                    {etiquetasEstado[u.estado] ?? u.estado})
                  </option>
                ))}
              </select>
              {errorDe("unidadId") && (
                <p className="baja-error">{errorDe("unidadId")}</p>
              )}
            </div>

            <div className="baja-field">
              <label htmlFor="motivo">Motivo de la baja</label>
              <select
                id="motivo"
                name="motivo"
                value={form.motivo}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("motivo"))}
              >
                <option value="">Seleccioná un motivo</option>
                {!esUnidadEmitida && <option value="VENCIDA">Vencida</option>}
                <option value="TRANSFUNDIDA">Transfundida</option>
                <option value="DESCARTADA">Descartada</option>
              </select>
              {esUnidadEmitida && (
                <p className="baja-vacio">
                  Para unidades emitidas solo se admite destino final Transfundida o Descartada.
                </p>
              )}
              {errorDe("motivo") && (
                <p className="baja-error">{errorDe("motivo")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Trazabilidad de la operación</legend>
          <div className="baja-grid">
            <div className="baja-field">
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
                <p className="baja-error">{errorDe("operador")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="baja-actions">
          <button type="submit" disabled={enviando}>
            {enviando ? "Registrando…" : "Confirmar baja"}
          </button>
        </div>
      </form>

      <section className="baja-inventario">
        <h2>Unidades registradas en inventario</h2>
        {cargandoInventario ? (
          <p className="baja-vacio">Cargando inventario…</p>
        ) : unidades.length === 0 ? (
          <p className="baja-vacio">
            Todavía no hay unidades registradas en el inventario.
          </p>
        ) : (
          <div className="baja-tabla-contenedor">
            <table className="baja-tabla">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Hemocomponente</th>
                  <th>Grupo / Factor</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Motivo de baja</th>
                  <th>Operador de baja</th>
                  <th>Fecha y hora de baja</th>
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
                    <td>
                      {u.motivoBaja
                        ? (etiquetasMotivoBaja[u.motivoBaja] ?? u.motivoBaja)
                        : "—"}
                    </td>
                    <td>{u.operadorBaja || "—"}</td>
                    <td>
                      {u.fechaBaja
                        ? formatearFechaHoraArgentina(u.fechaBaja)
                        : "—"}
                    </td>
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
