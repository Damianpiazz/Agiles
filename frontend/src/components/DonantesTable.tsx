import { useState } from "react";
import { DataTable, type DataTableColumn, type DataTableFilter } from "./DataTable";
import type { Donante } from "../types/donante";

type Props = {
  rows: Donante[];
  loading?: boolean;
  onVerDetalle: (donante: Donante) => void;
  onModificar?: (donante: Donante) => void;
  onDarDeBaja?: (donante: Donante) => void;
  onRegistrarDonacion?: (donante: Donante) => void;
  caption?: string;
};

function fecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-AR");
}

function texto(v: string | null | undefined) {
  return v?.trim() ? v : "—";
}

export function DonantesTable({
  rows,
  loading = false,
  onVerDetalle,
  onModificar,
  onDarDeBaja,
  onRegistrarDonacion,
  caption = "Donantes registrados en el sistema",
}: Props) {
  const [sexo, setSexo] = useState("");
  const [estado, setEstado] = useState("");

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
      id: "estado",
      label: "Estado",
      value: estado,
      options: [
        { value: "", label: "Todos" },
        { value: "activo", label: "Activo" },
        { value: "baja", label: "Dado de baja" },
      ],
      onChange: setEstado,
    },
  ];

  const columns: DataTableColumn<Donante>[] = [
    { id: "id", header: "ID", render: (d) => d.id, sortValue: (d) => d.id },
    {
      id: "nombre",
      header: "Nombre",
      render: (d) => <strong>{d.nombre}</strong>,
      sortValue: (d) => d.nombre,
    },
    {
      id: "apellido",
      header: "Apellido",
      render: (d) => <strong>{d.apellido}</strong>,
      sortValue: (d) => d.apellido,
    },
    { id: "dni", header: "DNI", render: (d) => d.dni, sortValue: (d) => d.dni },
    {
      id: "fechaNacimiento",
      header: "Fecha de nacimiento",
      render: (d) => fecha(d.fechaNacimiento),
      sortValue: (d) => d.fechaNacimiento,
    },
    {
      id: "lugarNacimiento",
      header: "Lugar de nacimiento",
      render: (d) => d.lugarNacimiento,
      sortValue: (d) => d.lugarNacimiento,
    },
    {
      id: "sexoBiologico",
      header: "Sexo biológico",
      render: (d) => (d.sexoBiologico === "FEMENINO" ? "Femenino" : "Masculino"),
      sortValue: (d) => d.sexoBiologico,
    },
    {
      id: "domicilio",
      header: "Domicilio",
      render: (d) => d.domicilio,
      sortValue: (d) => d.domicilio,
    },
    {
      id: "codigoPostal",
      header: "Código postal",
      render: (d) => d.codigoPostal,
      sortValue: (d) => d.codigoPostal,
    },
    {
      id: "email",
      header: "Email",
      render: (d) => d.email,
      sortValue: (d) => d.email,
    },
    {
      id: "telefonoFijo",
      header: "Teléfono fijo",
      render: (d) => texto(d.telefonoFijo),
      sortValue: (d) => d.telefonoFijo ?? "",
    },
    {
      id: "telefonoCelular",
      header: "Teléfono celular",
      render: (d) => d.telefonoCelular,
      sortValue: (d) => d.telefonoCelular,
    },
    {
      id: "activo",
      header: "Estado",
      render: (d) =>
        d.activo === false ? (
          <span className="ui-badge ui-badge-neutral">Dado de baja</span>
        ) : (
          <span className="ui-badge ui-badge-success">Activo</span>
        ),
      sortValue: (d) => (d.activo === false ? "baja" : "activo"),
    },
    {
      id: "operadorModificacion",
      header: "Última modificación",
      render: (d) => texto(d.operadorModificacion),
      sortValue: (d) => d.operadorModificacion ?? "",
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "ui-col-acciones",
      render: (d) => (
        <div className="ui-row-actions">
          <button
            type="button"
            className="ui-btn ui-btn-small ui-btn-secondary"
            onClick={(event) => {
              event.stopPropagation();
              onVerDetalle(d);
            }}
          >
            Ver detalle
          </button>
          {onModificar ? (
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={(event) => {
                event.stopPropagation();
                onModificar(d);
              }}
            >
              Modificar
            </button>
          ) : null}
          {onDarDeBaja ? (
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-danger"
              disabled={d.activo === false}
              onClick={(event) => {
                event.stopPropagation();
                onDarDeBaja(d);
              }}
            >
              Dar de baja
            </button>
          ) : null}
          {onRegistrarDonacion ? (
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-secondary"
              onClick={(event) => {
                event.stopPropagation();
                onRegistrarDonacion(d);
              }}
            >
              Registrar donación
            </button>
          ) : null}
        </div>
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
        (!estado || (estado === "activo" ? d.activo !== false : d.activo === false))
      }
      searchText={(d) =>
        [
          d.id,
          d.nombre,
          d.apellido,
          d.dni,
          d.fechaNacimiento,
          d.lugarNacimiento,
          d.sexoBiologico,
          d.domicilio,
          d.codigoPostal,
          d.email,
          d.telefonoFijo,
          d.telefonoCelular,
          d.operadorModificacion,
        ]
          .join(" ")
          .toLocaleLowerCase("es-AR")
      }
      searchPlaceholder="Buscar donante por DNI, nombre, apellido o contacto…"
      emptyTitle="No hay donantes para mostrar"
      emptyDescription="Ajustá los filtros o registrá un donante nuevo."
      caption={caption}
      onRowClick={onVerDetalle}
    />
  );
}
