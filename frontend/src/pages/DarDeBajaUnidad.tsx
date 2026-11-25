import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import { Banner } from "../components/Banner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import type { DataTableColumn } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import {
  bajaUnidadSchema,
  type BajaUnidadForm,
} from "../schemas/bajaUnidad";
import "../styles/DarDeBajaUnidad.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
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
  const [filtroEstado, setFiltroEstado] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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

  function focoPrimerError() {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);

    const parsed = bajaUnidadSchema.safeParse(form);
    if (!parsed.success) {
      setErrores(z.flattenError(parsed.error).fieldErrors as Errores);
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      focoPrimerError();
      return;
    }

    if (!unidadSeleccionada) {
      setBanner({ tipo: "error", texto: "Seleccioná una unidad válida." });
      return;
    }

    setErrores({});
    setConfirmando(true);
  }

  async function ejecutarBaja() {
    const parsed = bajaUnidadSchema.safeParse(form);
    if (!parsed.success) return;

    setConfirmando(false);
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
        focoPrimerError();
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
        id: "motivo",
        header: "Motivo de baja",
        sortValue: (u) => u.motivoBaja ?? "",
        render: (u) =>
          u.motivoBaja ? (etiquetasMotivoBaja[u.motivoBaja] ?? u.motivoBaja) : "—",
      },
      {
        id: "operadorBaja",
        header: "Operador de baja",
        sortValue: (u) => u.operadorBaja ?? "",
        render: (u) => u.operadorBaja || "—",
      },
      {
        id: "fechaBaja",
        header: "Fecha y hora de baja",
        sortValue: (u) => u.fechaBaja ?? "",
        render: (u) =>
          u.fechaBaja ? formatearFechaHoraArgentina(u.fechaBaja) : "—",
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
      u.motivoBaja ?? "",
      u.operadorBaja ?? "",
    ].join(" ");

  return (
    <div className="baja">
      <PageHeader
        title="Dar de baja unidad"
        description="Registrá la disposición final de una unidad de hemocomponente para que deje de estar disponible en el inventario, conservando su trazabilidad."
      />

      {banner ? <Banner tone={banner.tipo}>{banner.texto}</Banner> : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate>
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

      <ConfirmDialog
        open={confirmando}
        title="Confirmar baja de unidad"
        description={
          <>
            <p>
              Se dará de baja la unidad{" "}
              <strong>{unidadSeleccionada?.numeroUnidad ?? "—"}</strong> con el
              motivo <strong>{etiquetasMotivoBaja[form.motivo] ?? form.motivo}</strong>,
              registrada por <strong>{form.operador.trim()}</strong>.
            </p>
            <p>La unidad dejará de estar disponible y la operación quedará auditada.</p>
          </>
        }
        confirmLabel="Confirmar baja"
        destructive
        busy={enviando}
        onConfirm={() => void ejecutarBaja()}
        onCancel={() => setConfirmando(false)}
      />

      <section className="baja-inventario">
        <h2>Unidades registradas en inventario</h2>
        <DataTable
          rows={unidades}
          columns={columnas}
          rowKey={(u) => u.id}
          searchText={textoBusqueda}
          searchPlaceholder="Buscar por unidad, estado, motivo u operador…"
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
          emptyDescription="Las unidades recepcionadas aparecerán aquí con su trazabilidad."
          caption="Inventario de hemocomponentes"
        />
      </section>
    </div>
  );
}
