import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditoriaApi } from "@/features/auditoria/api/auditoria.api";
import type { EventoAuditoria } from "@/features/auditoria/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Section } from "@/shared/components/ui/Section";
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import { formatoFechaHora } from "@/shared/utils/formato";

export function AuditoriaPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "" });
  const { pagina, porPagina, setPagina, params } = usePaginacion(`${filtros.desde}|${filtros.hasta}`);

  const eventos = useQuery({
    queryKey: ["auditoria", filtros.desde, filtros.hasta, pagina],
    queryFn: () =>
      auditoriaApi.listar({
        desde: filtros.desde || undefined,
        hasta: filtros.hasta || undefined,
        ...params,
      }),
  });

  const columnas: Columna<EventoAuditoria>[] = [
    { clave: "fecha", titulo: "Fecha y hora", celda: (item) => formatoFechaHora(item.fechaHora) },
    { clave: "usuario", titulo: "Usuario", celda: (item) => <span className="mono">{item.usuario ?? "Sistema"}</span> },
    { clave: "accion", titulo: "Acción", celda: (item) => item.accion },
    {
      clave: "entidad",
      titulo: "Entidad",
      celda: (item) => `${item.entidad}${item.entidadId ? ` ${item.entidadId}` : ""}`,
    },
    { clave: "detalle", titulo: "Detalle", celda: (item) => item.detalle ?? item.ruta ?? "—" },
  ];

  return (
    <>
      <PageHeader
        title="Auditoría y trazabilidad"
        subtitle="Registro de quién, qué y cuándo. Solo lectura."
      />

      <Section title="Filtros por período">
        <div className="form-grid">
          <Field label="Desde" htmlFor="auditoria-desde" ancho={3}>
            <input id="auditoria-desde" className="input" type="date" value={desde} onChange={(evento) => setDesde(evento.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="auditoria-hasta" ancho={3}>
            <input id="auditoria-hasta" className="input" type="date" value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
          </Field>
          <div className="field field--6" style={{ justifyContent: "end" }}>
            <Button type="button" variant="primary" onClick={() => setFiltros({ desde, hasta })}>
              Aplicar
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Eventos" description={`${eventos.data?.meta.total ?? 0} registros`}>
        <DataTable
          columnas={columnas}
          filas={eventos.data?.data ?? []}
          claveFila={(item) => item.id}
          cargando={eventos.isLoading}
          error={eventos.isError ? "No se pudo consultar la auditoría." : undefined}
          onReintentar={() => void eventos.refetch()}
          meta={eventos.data?.meta}
          pagina={pagina}
          porPagina={porPagina}
          onCambiarPagina={setPagina}
        />
      </Section>
    </>
  );
}
