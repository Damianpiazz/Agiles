import { useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { usePacientesListado } from "../hooks/useDatos";
import type { PacienteListado } from "../types/datosGlobales";
import "../styles/BuscarDonante.css";

type Props = {
  onVerHistorial: (dni: string) => void;
};

type FiltroSolicitudes = "todos" | "con" | "sin";

const ETIQUETAS_FILTRO = [
  { value: "todos", label: "Todos" },
  { value: "con", label: "Con solicitudes" },
  { value: "sin", label: "Sin solicitudes" },
] as const;

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

function columnasPaciente(
  onVerHistorial: (dni: string) => void,
): DataTableColumn<PacienteListado>[] {
  return [
    {
      id: "paciente",
      header: "Paciente",
      render: (paciente) => (
        <strong>
          {paciente.nombre} {paciente.apellido}
        </strong>
      ),
      sortValue: (paciente) => `${paciente.nombre} ${paciente.apellido}`,
    },
    {
      id: "dni",
      header: "DNI",
      render: (paciente) => paciente.dni,
      sortValue: (paciente) => paciente.dni,
    },
    {
      id: "nacimiento",
      header: "Fecha de nacimiento",
      render: (paciente) => formatearFecha(paciente.fechaNacimiento),
      sortValue: (paciente) => paciente.fechaNacimiento,
    },
    {
      id: "solicitudes",
      header: "Solicitudes",
      render: (paciente) => paciente._count?.solicitudesTransfusion ?? 0,
      sortValue: (paciente) => paciente._count?.solicitudesTransfusion ?? 0,
    },
    {
      id: "operador",
      header: "Registrado por",
      render: (paciente) => paciente.operador,
      sortValue: (paciente) => paciente.operador,
    },
    {
      id: "alta",
      header: "Fecha y hora de alta",
      render: (paciente) => formatearFechaHora(paciente.createdAt),
      sortValue: (paciente) => paciente.createdAt,
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "ui-col-acciones",
      render: (paciente) => (
        <div className="ui-row-actions">
          <button
            type="button"
            className="ui-btn ui-btn-small ui-btn-secondary"
            onClick={() => onVerHistorial(paciente.dni)}
          >
            Ver detalle
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-small ui-btn-primary"
            onClick={() => onVerHistorial(paciente.dni)}
          >
            Ver historial
          </button>
        </div>
      ),
    },
  ];
}

export default function BuscarPaciente({ onVerHistorial }: Props) {
  const { datos: pacientes, cargando, error, recargar } = usePacientesListado();
  const [dniDirecto, setDniDirecto] = useState("");
  const [errorDni, setErrorDni] = useState("");
  const [filtroSolicitudes, setFiltroSolicitudes] =
    useState<FiltroSolicitudes>("todos");

  function irAlHistorial(evento: FormEvent) {
    evento.preventDefault();
    const dni = dniDirecto.trim();
    if (!/^\d{7,8}$/.test(dni)) {
      setErrorDni("Ingresá un DNI válido de 7 u 8 dígitos.");
      document.getElementById("historiaDniDirecto")?.focus();
      return;
    }
    setErrorDni("");
    onVerHistorial(dni);
  }

  return (
    <div className="consulta">
      <PageHeader
        title="Buscar paciente"
        description="Consultá todos los pacientes registrados, buscá por DNI o nombre y accedé a su historia integral."
      />

      {error ? (
        <Banner tone="error">
          {error}{" "}
          <button
            type="button"
            className="ui-btn ui-btn-small ui-btn-secondary"
            onClick={() => void recargar()}
          >
            Reintentar
          </button>
        </Banner>
      ) : null}

      <FormSection
        title="Acceso directo por DNI"
        description="Si conocés el DNI, podés abrir directamente la historia completa de la persona."
      >
        <form onSubmit={irAlHistorial} noValidate>
          <FormGrid columns={2}>
            <FormField
              id="historiaDniDirecto"
              label="DNI"
              hint="7 u 8 dígitos"
              error={errorDni}
            >
              <input
                id="historiaDniDirecto"
                inputMode="numeric"
                value={dniDirecto}
                aria-invalid={Boolean(errorDni)}
                onChange={(evento) => {
                  setDniDirecto(evento.target.value);
                  setErrorDni("");
                }}
              />
            </FormField>
          </FormGrid>
          <div className="ui-step-actions">
            <button type="submit" className="ui-btn ui-btn-primary">
              Ver historia
            </button>
          </div>
        </form>
      </FormSection>

      <section className="consulta-resultados" aria-labelledby="listadoPacientesTitulo">
        <h2 id="listadoPacientesTitulo">Todos los pacientes</h2>
        <DataTable
          rows={pacientes}
          columns={columnasPaciente(onVerHistorial)}
          rowKey={(paciente) => paciente.id}
          searchText={(paciente) =>
            [
              paciente.nombre,
              paciente.apellido,
              paciente.dni,
              paciente.operador,
            ].join(" ")
          }
          searchPlaceholder="Buscar por DNI, nombre, apellido u operador…"
          filters={[
            {
              id: "solicitudes",
              label: "Solicitudes",
              value: filtroSolicitudes,
              options: ETIQUETAS_FILTRO,
              onChange: (valor) =>
                setFiltroSolicitudes(valor as FiltroSolicitudes),
            },
          ]}
          filterRow={(paciente) => {
            const total = paciente._count?.solicitudesTransfusion ?? 0;
            if (filtroSolicitudes === "con") return total > 0;
            if (filtroSolicitudes === "sin") return total === 0;
            return true;
          }}
          loading={cargando}
          emptyTitle={error ? "No se pudieron cargar los pacientes" : "No hay pacientes registrados"}
          emptyDescription={
            error
              ? "Revisá la conexión con el servidor e intentá nuevamente."
              : "Los pacientes registrados aparecerán en este listado."
          }
          caption="Pacientes registrados con búsqueda, filtros, orden y paginación."
        />
      </section>
    </div>
  );
}
