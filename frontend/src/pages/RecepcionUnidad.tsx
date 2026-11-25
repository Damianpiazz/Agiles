import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import { Banner } from "../components/Banner";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import type { DataTableColumn } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import {
  obtenerFechaHoyArgentina,
  recepcionUnidadSchema,
  type RecepcionUnidadForm,
} from "../schemas/recepcionUnidad";
import "../styles/RecepcionUnidad.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
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
  EMITIDA: "Emitida",
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
  const [filtroEstado, setFiltroEstado] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

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

  function focoPrimerError() {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);

    const parsed = recepcionUnidadSchema.safeParse(form);
    if (!parsed.success) {
      setErrores(z.flattenError(parsed.error).fieldErrors as Errores);
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      focoPrimerError();
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
        focoPrimerError();
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

  const columnas = useMemo<DataTableColumn<UnidadInventario>[]>(
    () => [
      {
        id: "numeroUnidad",
        header: "Unidad",
        sortValue: (u) => u.numeroUnidad,
        render: (u) => <strong>{u.numeroUnidad}</strong>,
      },
      {
        id: "tipo",
        header: "Hemocomponente",
        sortValue: (u) => u.tipoHemocomponente,
        render: (u) => etiquetasHemocomponente[u.tipoHemocomponente] ?? u.tipoHemocomponente,
      },
      {
        id: "grupo",
        header: "Grupo / Factor",
        sortValue: (u) => `${u.grupoABO}${u.factorRhD}`,
        render: (u) => `${u.grupoABO} ${u.factorRhD === "POSITIVO" ? "+" : "-"}`,
      },
      {
        id: "vencimiento",
        header: "Vencimiento",
        sortValue: (u) => u.fechaVencimiento,
        render: (u) => formatearFechaVencimiento(u.fechaVencimiento),
      },
      {
        id: "estado",
        header: "Estado",
        sortValue: (u) => u.estado,
        render: (u) => <StatusBadge estado={u.estado} />,
      },
      {
        id: "operador",
        header: "Operador",
        sortValue: (u) => u.operador,
        render: (u) => u.operador || "—",
      },
      {
        id: "recepcion",
        header: "Recepción",
        sortValue: (u) => u.fechaRecepcion,
        render: (u) => formatearFechaHoraArgentina(u.fechaRecepcion),
      },
    ],
    [],
  );

  const textoBusqueda = (u: UnidadInventario) =>
    [
      u.numeroUnidad,
      etiquetasHemocomponente[u.tipoHemocomponente] ?? u.tipoHemocomponente,
      u.grupoABO,
      u.factorRhD,
      u.estado,
      u.operador,
    ].join(" ");

  return (
    <div className="recepcion">
      <PageHeader
        title="Registrar recepción de unidades"
        description="Incorporá unidades de hemocomponentes al inventario manteniendo su disponibilidad y trazabilidad."
      />

      {banner ? <Banner tone={banner.tipo}>{banner.texto}</Banner> : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate>
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
        <DataTable
          rows={unidades}
          columns={columnas}
          rowKey={(u) => u.id}
          searchText={textoBusqueda}
          searchPlaceholder="Buscar por unidad, grupo, operador o estado…"
          loading={cargandoInventario}
          filters={[
            {
              id: "estado",
              label: "Estado",
              value: filtroEstado,
              options: [
                { value: "", label: "Todos los estados" },
                ...["DISPONIBLE", "RESERVADA", "EMITIDA", "BLOQUEADA", "VENCIDA", "DADA_DE_BAJA"].map(
                  (estado) => ({
                    value: estado,
                    label: etiquetasEstado[estado] ?? estado,
                  }),
                ),
              ],
              onChange: setFiltroEstado,
            },
          ]}
          filterRow={(u) => !filtroEstado || u.estado === filtroEstado}
          emptyTitle="No hay unidades registradas"
          emptyDescription="Las unidades recepcionadas aparecerán aquí con su estado y trazabilidad."
          caption="Inventario de hemocomponentes"
        />
      </section>
    </div>
  );
}
