import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "./DataTable";
import type { Donante } from "../types/donante";

type Props = {
  rows: Donante[];
  loading?: boolean;
  selectedId: number | "";
  onSelect: (donante: Donante) => void;
  caption?: string;
};

type Franja = "" | "menor30" | "30-39" | "40-49" | "50mas";

function fecha(valor: string) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? "—"
    : fecha.toLocaleDateString("es-AR");
}

function edad(valor: string): number | null {
  const nacimiento = new Date(valor);
  if (Number.isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) años -= 1;
  return años;
}

function cumpleFranja(valor: string, franja: Franja) {
  if (!franja) return true;
  const años = edad(valor);
  if (años === null) return false;
  if (franja === "menor30") return años < 30;
  if (franja === "30-39") return años >= 30 && años <= 39;
  if (franja === "40-49") return años >= 40 && años <= 49;
  return años >= 50;
}

/** Tabla de donantes activos para elegir el donante de una donación. */
export function SeleccionDonantesTable({
  rows,
  loading = false,
  selectedId,
  onSelect,
  caption = "Donantes disponibles para registrar una donación",
}: Props) {
  const [sexo, setSexo] = useState("");
  const [franja, setFranja] = useState<Franja>("");

  const filters: DataTableFilter[] = [
    {
      id: "sexo",
      label: "Sexo biológico",
      value: sexo,
      options: [
        { value: "", label: "Todos" },
        { value: "FEMENINO", label: "Femenino" },
        { value: "MASCULINO", label: "Masculino" },
      ],
      onChange: setSexo,
    },
    {
      id: "franja",
      label: "Edad",
      value: franja,
      options: [
        { value: "", label: "Todas" },
        { value: "menor30", label: "Menor de 30" },
        { value: "30-39", label: "30 a 39" },
        { value: "40-49", label: "40 a 49" },
        { value: "50mas", label: "50 o más" },
      ],
      onChange: (valor) => setFranja(valor as Franja),
    },
  ];

  const columns: DataTableColumn<Donante>[] = [
    {
      id: "donante",
      header: "Apellido y nombre",
      render: (d) => (
        <strong>
          {d.apellido}, {d.nombre}
        </strong>
      ),
      sortValue: (d) => `${d.apellido} ${d.nombre}`,
    },
    { id: "dni", header: "DNI", render: (d) => d.dni, sortValue: (d) => d.dni },
    {
      id: "sexoBiologico",
      header: "Sexo biológico",
      render: (d) => (d.sexoBiologico === "FEMENINO" ? "Femenino" : "Masculino"),
      sortValue: (d) => d.sexoBiologico,
    },
    {
      id: "fechaNacimiento",
      header: "Fecha de nacimiento",
      render: (d) => fecha(d.fechaNacimiento),
      sortValue: (d) => d.fechaNacimiento,
    },
    {
      id: "acciones",
      header: "Selección",
      className: "donacion-col-seleccion",
      render: (d) =>
        d.id === selectedId ? (
          <span className="ui-badge ui-badge-success">Seleccionado</span>
        ) : (
          <button
            type="button"
            className="ui-btn ui-btn-small ui-btn-secondary"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(d);
            }}
          >
            Seleccionar
          </button>
        ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(d) => d.id}
      loading={loading}
      filters={filters}
      filterRow={(d) =>
        (!sexo || d.sexoBiologico === sexo) &&
        cumpleFranja(d.fechaNacimiento, franja)
      }
      searchText={(d) =>
        [d.id, d.apellido, d.nombre, d.dni, d.sexoBiologico, d.fechaNacimiento]
          .join(" ")
          .toLocaleLowerCase("es-AR")
      }
      searchPlaceholder="Buscar donante por DNI, nombre o apellido…"
      emptyTitle="No hay donantes para mostrar"
      emptyDescription="Ajustá la búsqueda o los filtros para encontrar al donante."
      caption={caption}
      onRowClick={onSelect}
      rowClassName={(d) =>
        d.id === selectedId ? "donacion-fila-seleccionada" : undefined
      }
    />
  );
}
