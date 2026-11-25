import { useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DonacionesTable } from "../components/DonacionesTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useDonaciones } from "../hooks/useDatos";
import type { DonacionResumen } from "../types/donacion";
import "../styles/TipificacionSanguinea.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

type Tipificacion = {
  id: number;
  donacionId: number;
  grupoABO: "A" | "B" | "AB" | "O";
  factorRhD: "POSITIVO" | "NEGATIVO";
  operador: string;
  fechaHora: string;
};

type BannerMensaje = {
  tipo: "ok" | "error";
  texto: string;
} | null;

const columnasHistorial: DataTableColumn<Tipificacion>[] = [
  {
    id: "id",
    header: "ID",
    render: (item) => item.id,
    sortValue: (item) => item.id,
  },
  {
    id: "grupoABO",
    header: "Grupo ABO",
    render: (item) => item.grupoABO,
    sortValue: (item) => item.grupoABO,
  },
  {
    id: "factorRhD",
    header: "Factor RhD",
    render: (item) => (
      <StatusBadge
        estado={item.factorRhD}
        etiqueta={item.factorRhD === "POSITIVO" ? "Positivo (+)" : "Negativo (-)"}
      />
    ),
    sortValue: (item) => item.factorRhD,
  },
  {
    id: "operador",
    header: "Operador",
    render: (item) => item.operador,
    sortValue: (item) => item.operador,
  },
  {
    id: "fechaHora",
    header: "Fecha y hora",
    render: (item) => new Date(item.fechaHora).toLocaleString("es-AR"),
    sortValue: (item) => item.fechaHora,
  },
];

export default function TipificacionSanguinea() {
  const { datos: donaciones, cargando } = useDonaciones();
  const [seleccionada, setSeleccionada] = useState<DonacionResumen | null>(null);
  const [grupoABO, setGrupoABO] = useState("");
  const [factorRhD, setFactorRhD] = useState("");
  const [operador, setOperador] = useState("");

  const [historial, setHistorial] = useState<Tipificacion[]>([]);
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroFactor, setFiltroFactor] = useState("");
  const [banner, setBanner] = useState<BannerMensaje>(null);

  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [historialConsultado, setHistorialConsultado] = useState(false);

  function obtenerIdDonacion(): number | null {
    if (!seleccionada) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná una donación de la tabla antes de continuar.",
      });
      document.getElementById("donacionesTipificacion")?.scrollIntoView({ behavior: "smooth" });
      return null;
    }

    return seleccionada.id;
  }

  function seleccionar(donacion: DonacionResumen) {
    setSeleccionada(donacion);
    setHistorial([]);
    setHistorialConsultado(false);
    setBanner(null);
  }

  async function consultarHistorial() {
    setBanner(null);
    setHistorial([]);
    setHistorialConsultado(false);

    const id = obtenerIdDonacion();

    if (id === null) return;

    setConsultando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/tipificaciones-sanguineas/donacion/${id}`,
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.error || "No se pudo consultar el historial.",
        );
      }

      setHistorial(datos as Tipificacion[]);
      setHistorialConsultado(true);

      if (datos.length === 0) {
        setBanner({
          tipo: "ok",
          texto: "La donación no tiene tipificaciones registradas.",
        });
      } else {
        setBanner({
          tipo: "ok",
          texto: "Historial consultado correctamente.",
        });
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
      setConsultando(false);
    }
  }

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);

    const id = obtenerIdDonacion();

    if (id === null) return;

    if (!grupoABO || !factorRhD) {
      setBanner({
        tipo: "error",
        texto: "Seleccioná el grupo ABO y el factor RhD.",
      });
      document.getElementById(!grupoABO ? "grupoABO" : "factorRhDPositivo")?.focus();
      return;
    }

    if (!operador.trim()) {
      setBanner({
        tipo: "error",
        texto: "Ingresá el nombre del operador.",
      });
      document.getElementById("tipificacionOperador")?.focus();
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/tipificaciones-sanguineas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            donacionId: id,
            grupoABO,
            factorRhD,
            operador: operador.trim(),
          }),
        },
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.error || "No se pudo registrar la tipificación.",
        );
      }

      setBanner({
        tipo: "ok",
        texto: `Tipificación #${datos.id} registrada correctamente para la donación #${id}.`,
      });

      setGrupoABO("");
      setFactorRhD("");

      // Actualiza el historial después de guardar.
      const respuestaHistorial = await fetch(
        `${API_URL}/api/tipificaciones-sanguineas/donacion/${id}`,
      );

      if (respuestaHistorial.ok) {
        const datosHistorial = await respuestaHistorial.json();
        setHistorial(datosHistorial as Tipificacion[]);
        setHistorialConsultado(true);
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

  return (
    <div className="tipificacion-container">
      <PageHeader
        title="Tipificación sanguínea ABO/RhD"
        description="Seleccioná una donación de la tabla y registrá su grupo sanguíneo y factor RhD."
      />

      {banner && (
        <Banner tone={banner.tipo === "error" ? "error" : "ok"}>
          {banner.texto}
        </Banner>
      )}

      <section id="donacionesTipificacion" className="tipificacion-card" aria-labelledby="donacionesTipificacionTitulo">
        <h2 id="donacionesTipificacionTitulo">Donaciones registradas</h2>
        <DonacionesTable
          rows={donaciones}
          loading={cargando}
          selectedId={seleccionada?.id ?? null}
          onSeleccionar={seleccionar}
          actionLabel="Tipificar"
        />
        <p className="tipificacion-seleccion" aria-live="polite">
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

      <section className="tipificacion-card">
        <FormSection title="Datos de la tipificación">
          <form onSubmit={registrar} className="tipificacion-form">
          <FormGrid columns={2}>
            <FormField id="grupoABO" label="Grupo ABO" required>
              <select
                id="grupoABO"
                value={grupoABO}
                onChange={(e) => setGrupoABO(e.target.value)}
                required
              >
                <option value="">Seleccioná un grupo</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </FormField>
          </FormGrid>

          <FormSection title="Factor RhD">
            <div className="tipificacion-opciones" role="group" aria-label="Factor RhD">
              <label>
                <input
                  id="factorRhDPositivo"
                  type="radio"
                  name="factorRhD"
                  value="POSITIVO"
                  checked={factorRhD === "POSITIVO"}
                  onChange={(e) => setFactorRhD(e.target.value)}
                  required
                />
                Positivo (+)
              </label>

              <label>
                <input
                  id="factorRhDNegativo"
                  type="radio"
                  name="factorRhD"
                  value="NEGATIVO"
                  checked={factorRhD === "NEGATIVO"}
                  onChange={(e) => setFactorRhD(e.target.value)}
                />
                Negativo (-)
              </label>
            </div>
          </FormSection>

          <FormField id="tipificacionOperador" label="Operador" required>
            <input
              id="tipificacionOperador"
              type="text"
              maxLength={120}
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              placeholder="Nombre del operador"
              required
            />
          </FormField>

          <div className="tipificacion-actions">
            <button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Registrar tipificación"}
            </button>

            <button
              type="button"
              className="tipificacion-button-secondary"
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
        <section className="tipificacion-card tipificacion-historial">
          <h2>Historial de la donación #{seleccionada?.id ?? "—"}</h2>

          <DataTable
            rows={historial}
            columns={columnasHistorial}
            rowKey={(item) => item.id}
            searchText={(item) =>
              `${item.id} ${item.grupoABO} ${item.factorRhD} ${item.operador} ${new Date(item.fechaHora).toLocaleString("es-AR")}`
            }
            searchPlaceholder="Buscar en el historial…"
            filters={[
              {
                id: "grupo",
                label: "Grupo",
                value: filtroGrupo,
                options: [
                  { value: "", label: "Todos los grupos" },
                  { value: "A", label: "A" },
                  { value: "B", label: "B" },
                  { value: "AB", label: "AB" },
                  { value: "O", label: "O" },
                ],
                onChange: setFiltroGrupo,
              },
              {
                id: "factor",
                label: "Factor",
                value: filtroFactor,
                options: [
                  { value: "", label: "Todos los factores" },
                  { value: "POSITIVO", label: "Positivo" },
                  { value: "NEGATIVO", label: "Negativo" },
                ],
                onChange: setFiltroFactor,
              },
            ]}
            filterRow={(item) =>
              (!filtroGrupo || item.grupoABO === filtroGrupo) &&
              (!filtroFactor || item.factorRhD === filtroFactor)
            }
            loading={consultando}
            emptyTitle="Sin resultados"
            emptyDescription="No hay tipificaciones registradas para esta donación."
            caption={`Historial de la donación #${seleccionada?.id ?? "—"}`}
          />
        </section>
      )}
    </div>
  );
}