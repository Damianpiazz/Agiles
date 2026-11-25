import { useState } from "react";
import { Banner } from "./Banner";
import { DataTable, type DataTableColumn, type DataTableFilter } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import type { DonacionResumen } from "../types/donacion";

type Props = {
  rows: DonacionResumen[];
  loading?: boolean;
  error?: string;
  selectedId?: number | null;
  onSeleccionar: (donacion: DonacionResumen) => void;
  actionLabel?: string;
  caption?: string;
};

function fecha(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function tipificacion(donacion: DonacionResumen) {
  const resultado = donacion.tipificacionesSanguineas[0];
  return resultado ? `${resultado.grupoABO}${resultado.factorRhD === "POSITIVO" ? "+" : "-"}` : "—";
}

export function DonacionesTable({
  rows,
  loading = false,
  error = "",
  selectedId,
  onSeleccionar,
  actionLabel = "Seleccionar",
  caption = "Donaciones registradas en el sistema",
}: Props) {
  const [estado, setEstado] = useState("");
  const [estadoUnidad, setEstadoUnidad] = useState("");
  const [avance, setAvance] = useState("");

  const filters: DataTableFilter[] = [
    {
      id: "estado",
      label: "Estado de la donación",
      value: estado,
      options: [
        { value: "", label: "Todos" },
        { value: "REGISTRADA", label: "Registrada" },
        { value: "EN_CALIFICACION", label: "En calificación" },
        { value: "CALIFICADA", label: "Calificada" },
        { value: "RECHAZADA", label: "Rechazada" },
      ],
      onChange: setEstado,
    },
    {
      id: "estadoUnidad",
      label: "Estado de la unidad",
      value: estadoUnidad,
      options: [
        { value: "", label: "Todos" },
        { value: "PENDIENTE", label: "Pendiente" },
        { value: "LIBERADA", label: "Liberada" },
        { value: "BLOQUEADA", label: "Bloqueada" },
      ],
      onChange: setEstadoUnidad,
    },
    {
      id: "avance",
      label: "Estudios",
      value: avance,
      options: [
        { value: "", label: "Todas" },
        { value: "sinCalificacion", label: "Sin calificación" },
        { value: "conCalificacion", label: "Con calificación" },
        { value: "sinTipificacion", label: "Sin tipificación" },
      ],
      onChange: setAvance,
    },
  ];

  const columns: DataTableColumn<DonacionResumen>[] = [
    { id: "id", header: "ID", render: (d) => d.id, sortValue: (d) => d.id },
    {
      id: "donante",
      header: "Donante",
      render: (d) => (
        <strong>
          {d.donante.apellido}, {d.donante.nombre}
        </strong>
      ),
      sortValue: (d) => `${d.donante.apellido} ${d.donante.nombre}`,
    },
    {
      id: "dni",
      header: "DNI",
      render: (d) => d.donante.dni,
      sortValue: (d) => d.donante.dni,
    },
    {
      id: "fechaHora",
      header: "Fecha y hora",
      render: (d) => fecha(d.fechaHora),
      sortValue: (d) => d.fechaHora,
    },
    {
      id: "estado",
      header: "Estado",
      render: (d) => <StatusBadge estado={d.estado} />,
      sortValue: (d) => d.estado,
    },
    {
      id: "estadoUnidad",
      header: "Unidad",
      render: (d) => <StatusBadge estado={d.estadoUnidad} />,
      sortValue: (d) => d.estadoUnidad,
    },
    {
      id: "operador",
      header: "Operador",
      render: (d) => d.operador,
      sortValue: (d) => d.operador,
    },
    {
      id: "calificacion",
      header: "Calificación",
      render: (d) =>
        d.calificacionBiologica ? (
          <StatusBadge estado={d.calificacionBiologica.estado} />
        ) : (
          "Sin iniciar"
        ),
      sortValue: (d) => d.calificacionBiologica?.estado ?? "",
    },
    {
      id: "tipificacion",
      header: "Tipificación",
      render: (d) => tipificacion(d),
      sortValue: (d) => tipificacion(d),
    },
    {
      id: "anticuerpos",
      header: "Anticuerpos",
      render: (d) =>
        d.anticuerpoIrregular ? (
          <StatusBadge estado={d.anticuerpoIrregular.resultado} />
        ) : (
          "Sin registrar"
        ),
      sortValue: (d) => d.anticuerpoIrregular?.resultado ?? "",
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "ui-col-acciones",
      render: (d) => (
        <div className="ui-row-actions">
          <button
            type="button"
            className={`ui-btn ui-btn-small ${selectedId === d.id ? "ui-btn-primary" : "ui-btn-secondary"}`}
            aria-pressed={selectedId === d.id}
            onClick={(event) => {
              event.stopPropagation();
              onSeleccionar(d);
            }}
          >
            {selectedId === d.id ? "Seleccionada" : actionLabel}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-data-table-wrap">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(d) => d.id}
        loading={loading}
        filters={filters}
        filterRow={(d) =>
          (!estado || d.estado === estado) &&
          (!estadoUnidad || d.estadoUnidad === estadoUnidad) &&
          (!avance ||
            (avance === "sinCalificacion" && !d.calificacionBiologica) ||
            (avance === "conCalificacion" && Boolean(d.calificacionBiologica)) ||
            (avance === "sinTipificacion" && d.tipificacionesSanguineas.length === 0))
        }
        searchText={(d) =>
          [
            d.id,
            d.donante.nombre,
            d.donante.apellido,
            d.donante.dni,
            d.operador,
            d.estado,
            d.estadoUnidad,
            fecha(d.fechaHora),
          ]
            .join(" ")
            .toLocaleLowerCase("es-AR")
        }
        searchPlaceholder="Buscar donación por donante, DNI, ID u operador…"
        emptyTitle="No hay donaciones para mostrar"
        emptyDescription="Ajustá los filtros o registrá una donación nueva."
        caption={caption}
        onRowClick={onSeleccionar}
      />
    </div>
  );
}
