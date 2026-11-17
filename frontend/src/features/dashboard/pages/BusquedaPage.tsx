import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { rutas } from "@/app/router/paths";
import { personasApi } from "@/features/personas/api/personas.api";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import type { Persona } from "@/features/personas/types";
import { Button } from "@/shared/components/ui/Button";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { documentoLegible, formatoFecha, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

const ACCESOS = [
  { to: rutas.postaFija, etiqueta: "Registrar donación (Posta fija)", icono: "♥" },
  { to: rutas.unidadTransfusional, etiqueta: "Registrar transfusión", icono: "⊕" },
  { to: rutas.gestantes, etiqueta: "Cargar estudio de gestante", icono: "◌" },
  { to: rutas.donacionesEstudios, etiqueta: "Cargar serologías y PCI", icono: "◉" },
];

export function BusquedaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [termino, setTermino] = useState(searchParams.get("q") ?? "");
  const navigate = useNavigate();
  const consulta = searchParams.get("q")?.trim() ?? "";

  const resultados = useQuery({
    queryKey: ["personas", "buscar", consulta],
    queryFn: () => personasApi.buscar(consulta),
    enabled: consulta.length > 0,
  });

  const revision = useQuery({
    queryKey: ["personas", "revision"],
    queryFn: () => personasApi.revision(),
  });

  function buscar() {
    const valor = termino.trim();
    setSearchParams(valor ? { q: valor } : {});
  }

  const personas = resultados.data ?? [];
  const cantidadRevision = revision.data?.length ?? 0;
  const columnas: Columna<Persona>[] = [
    {
      clave: "dni",
      titulo: "DNI",
      celda: (persona) => <span className="mono">{documentoLegible(persona.dni)}</span>,
    },
    { clave: "nombre", titulo: "Nombre y apellido", celda: (persona) => nombreCompleto(persona) },
    {
      clave: "grupo",
      titulo: "G y F",
      celda: (persona) => <span className="mono">{grupoFactorLegible(persona.grupoFactor)}</span>,
    },
    { clave: "nacimiento", titulo: "Nacimiento", celda: (persona) => formatoFecha(persona.fechaNacimiento) },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (persona) => {
        const estado = presentacionSemaforo(persona.semaforo);
        return (
          <StatusChip tono={estado.tono} icono={estado.icono}>
            {estado.etiqueta}
          </StatusChip>
        );
      },
    },
    {
      clave: "accion",
      titulo: "Acción",
      celda: (persona) => (
        <Link to={`${rutas.personas}?id=${persona.id}`}>Ver en Personas</Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Búsqueda unificada"
        subtitle="Ingresá el DNI para ver historial clínico, donaciones, transfusiones y antecedentes obstétricos."
      />

      <Section title="Búsqueda" description="Buscar por DNI, nombre o HC (Ctrl K)">
        <SearchField
          label="DNI (documento)"
          placeholder="Buscar por DNI, nombre o HC"
          value={termino}
          onChange={setTermino}
          onSubmit={buscar}
          submitLabel="Buscar persona"
          autoFocus
        />
      </Section>

      {resultados.isError ? (
        <Notice tono="danger" titulo="No se pudo completar la búsqueda">
          No hay conexión con el servidor. Reintentá cuando se restablezca.
        </Notice>
      ) : null}

      {consulta ? (
        <Section
          title="Resultado"
          description={`${personas.length} ${personas.length === 1 ? "persona encontrada" : "personas encontradas"}`}
        >
          {resultados.isLoading ? <p className="soft">Buscando…</p> : null}
          {!resultados.isLoading && personas.length === 0 ? (
            <Notice tono="info" titulo="Sin resultados">
              No hay personas para «{consulta}». Verificá el DNI o cargá una persona nueva desde Personas.
            </Notice>
          ) : null}
          {personas.length > 0 ? (
            <>
              <PersonBanner persona={personas[0]} estado={presentacionSemaforo(personas[0].semaforo)} />
              <p className="soft" style={{ marginBottom: "var(--s-4)" }}>
                DNI {documentoLegible(personas[0].dni)} · HC {personas[0].historiaClinica ?? "—"} · Grupo{" "}
                {grupoFactorLegible(personas[0].grupoFactor)} · {personas[0].edad ?? "—"} años
              </p>
              <DataTable columnas={columnas} filas={personas} claveFila={(persona) => persona.id} />
              <p className="muted" style={{ marginTop: "var(--s-3)", fontSize: "var(--text-body-sm)" }}>
                Historial: Donante ({personas[0].resumen?.donaciones ?? 0}) · Paciente (
                {personas[0].resumen?.transfusiones ?? 0}) · Gestante/RN (
                {personas[0].resumen?.estudiosGestante ?? 0}/{personas[0].resumen?.recienNacidos ?? 0})
              </p>
              <div className="page-header__actions" style={{ marginTop: "var(--s-4)" }}>
                <Button type="button" onClick={() => navigate(`${rutas.personas}?id=${personas[0].id}`)}>
                  Ver en Personas
                </Button>
              </div>
            </>
          ) : null}
        </Section>
      ) : null}

      <Section title="Accesos rápidos" description="Acciones frecuentes del servicio">
        <div className="link-list">
          {ACCESOS.map((acceso) => (
            <Link className="link-list__item" key={acceso.to} to={acceso.to}>
              <span>
                <span aria-hidden="true">{acceso.icono}</span> {acceso.etiqueta}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        title="Donantes en revisión"
        description={
          cantidadRevision > 0
            ? `${cantidadRevision} ${cantidadRevision === 1 ? "caso con serología dudosa pendiente" : "casos con serología dudosa pendientes"} de segunda muestra.`
            : "Serología dudosa pendiente de segunda muestra"
        }
      >
        {revision.isLoading ? <p className="soft">Cargando…</p> : null}
        {revision.isError ? (
          <Notice tono="warn" titulo="Sin datos de revisión">
            No se pudo consultar el listado de donantes en revisión.
          </Notice>
        ) : null}
        {revision.data && revision.data.length === 0 ? (
          <p className="soft">Ningún donante con serología dudosa pendiente.</p>
        ) : null}
        {revision.data && revision.data.length > 0 ? (
          <ul>
            {revision.data.map((persona) => (
              <li key={persona.id}>
                <Link to={`${rutas.personas}?id=${persona.id}`}>{nombreCompleto(persona)}</Link>{" "}
                <span className="muted mono">DNI {documentoLegible(persona.dni)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </>
  );
}
