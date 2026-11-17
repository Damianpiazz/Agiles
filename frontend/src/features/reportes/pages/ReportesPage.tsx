import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { reportesApi } from "@/features/reportes/api/reportes.api";
import type { NumeroHemo } from "@/features/reportes/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Section } from "@/shared/components/ui/Section";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { formatoFecha, formatoNumero } from "@/shared/utils/formato";

interface InformeFila {
  titulo: string;
  detalle: string;
  numeros: NumeroHemo[];
}

const INFORMES: InformeFila[] = [
  {
    titulo: "HEMO 1 · Donantes atendidos y aptitud",
    detalle: "Ingresos, aptitud y tipo de donante",
    numeros: [1],
  },
  {
    titulo: "HEMO 2 · Hemocomponentes obtenidos y descartes",
    detalle: "Componentes, fracciones y descartes",
    numeros: [2],
  },
  {
    titulo: "HEMO 3-5 · Transfusiones, reacciones, gestantes/RN",
    detalle: "Transfusiones, reacciones y estudios inmunohematológicos",
    numeros: [3, 4, 5],
  },
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function periodoLegible(desde: string | null | undefined, hasta: string | null | undefined): string {
  if (!desde || !hasta) return "";
  const [anio, mes] = desde.split("-").map(Number);
  const [anioFin, mesFin] = hasta.split("-").map(Number);
  if (!anio || !mes || !anioFin || !mesFin) return "";
  if (anio === anioFin && mes === mesFin) return `${MESES[mes - 1]} ${anio}`;
  return `${formatoFecha(desde)} — ${formatoFecha(hasta)}`;
}

const ETIQUETAS: Record<string, string> = {
  id: "ID",
  fecha: "Fecha",
  dni: "DNI",
  paciente: "Paciente",
  telefono: "Teléfono",
  grupoFactor: "G y F",
  aptitud: "Aptitud",
  tipoDonante: "Tipo de donante",
  hemocomponente: "Hemocomponente",
  resultado: "Resultado",
  reaccion: "Reacción",
  tipo: "Tipo",
  numero: "N°",
  numeroOLote: "N° / Lote",
  operador: "Operador",
  pci: "PCI",
  observaciones: "Observaciones",
  madre: "Madre",
  madreDni: "DNI madre",
  grupoFactorMadre: "G y F madre",
};

type Fila = Record<string, unknown>;

function columnasDe(filas: Fila[]): Columna<Fila>[] {
  const claves = filas.length > 0 ? Object.keys(filas[0]) : [];
  return claves.map((clave) => ({
    clave,
    titulo: ETIQUETAS[clave] ?? clave.replace(/([A-Z])/g, " $1").replace(/^./, (letra) => letra.toUpperCase()),
    celda: (fila) => {
      const valor = fila[clave];
      if (valor === null || valor === undefined || valor === "") return "—";
      if (typeof valor === "number") return <span className="tabular">{formatoNumero(valor, false)}</span>;
      if (clave.toLowerCase().includes("fecha") && typeof valor === "string") return formatoFecha(valor);
      return String(valor);
    },
  }));
}

export function ReportesPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [seleccionado, setSeleccionado] = useState<NumeroHemo | null>(null);
  const params = { desde: desde || undefined, hasta: hasta || undefined };

  const resumen = useQuery({ queryKey: ["reportes", "resumen", desde, hasta], queryFn: () => reportesApi.resumen(params) });
  const informe = useQuery({
    queryKey: ["reportes", "hemo", seleccionado, desde, hasta],
    queryFn: () => reportesApi.hemo(seleccionado ?? 1, params),
    enabled: seleccionado !== null,
  });

  const descargar = useMutation({
    mutationFn: () => reportesApi.descargarResumen(params),
  });

  const descargarInforme = useMutation({
    mutationFn: (numero: NumeroHemo) => reportesApi.descargar(numero, params),
  });

  const datosResumen = resumen.data;
  const aptitud = datosResumen?.aptitud;
  const periodo = periodoLegible(datosResumen?.desde, datosResumen?.hasta);
  const tarjetas = [
    { etiqueta: "Donantes atendidos", valor: datosResumen?.donantesAtendidos },
    { etiqueta: "Hemocomponentes transfundidos", valor: datosResumen?.hemocomponentesTransfundidos },
    { etiqueta: "Unidades descartadas", valor: datosResumen?.unidadesDescartadas },
    { etiqueta: "Gestantes estudiadas", valor: datosResumen?.gestantesEstudiadas },
  ];

  return (
    <>
      <PageHeader
        title="Informes estadísticos (HEMO 1-5)"
        subtitle="Consolidación automática para el Instituto de Hemoterapia."
        actions={
          <Button type="button" variant="primary" loading={descargar.isPending} onClick={() => descargar.mutate()}>
            Exportar período
          </Button>
        }
      />

      {(descargar.isError || descargarInforme.isError) ? (
        <Notice tono="danger" titulo="No se pudo exportar">
          {mensajeDeError(descargar.error ?? descargarInforme.error)}
        </Notice>
      ) : null}

      <Section title="Período" description="Desde / hasta — se aplica al resumen y a todas las planillas">
        <div className="form-grid">
          <Field label="Desde" htmlFor="reporte-desde" ancho={3}>
            <input id="reporte-desde" className="input" type="date" value={desde} onChange={(evento) => setDesde(evento.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="reporte-hasta" ancho={3}>
            <input id="reporte-hasta" className="input" type="date" value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Resumen del período" description={datosResumen ? `${formatoFecha(datosResumen.desde)} — ${formatoFecha(datosResumen.hasta)}` : "Cargando datos…"}>
        <div className="metric-grid">
          {tarjetas.map((tarjeta) => (
            <div className="metric" key={tarjeta.etiqueta}>
              <div className="metric__label">{tarjeta.etiqueta}</div>
              <div className="metric__value">{tarjeta.valor === undefined ? "…" : formatoNumero(tarjeta.valor, false)}</div>
            </div>
          ))}
        </div>
        {datosResumen ? (
          <p className="muted" style={{ marginTop: "var(--s-4)" }}>
            Donantes únicos: {formatoNumero(datosResumen.donantesUnicos ?? 0, false)} · Aptos:{" "}
            {formatoNumero(aptitud?.aptos ?? 0, false)} · En revisión:{" "}
            {formatoNumero(aptitud?.enRevision ?? 0, false)} · Excluidos:{" "}
            {formatoNumero(aptitud?.excluidos ?? 0, false)} · RN estudiados:{" "}
            {formatoNumero(datosResumen.recienNacidosEstudiados ?? 0, false)} · Sangrías:{" "}
            {formatoNumero(datosResumen.sangriasTerapeuticas ?? 0, false)}
          </p>
        ) : null}
      </Section>

      <Section
        title={periodo ? `Planillas generadas (${periodo})` : "Planillas generadas"}
        description="Ver / Descargar · Datos consolidados automáticamente"
      >
        <div className="link-list">
          {INFORMES.map((fila) => (
            <div className="link-list__item" key={fila.titulo}>
              <span>
                <strong>{fila.titulo}</strong>
                <span className="muted"> · {fila.detalle}</span>
              </span>
              <div className="action-links">
                {fila.numeros.map((numero) => (
                  <span className="action-group" key={numero}>
                    {fila.numeros.length > 1 ? <span className="muted">HEMO {numero}</span> : null}
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSeleccionado(numero)}>
                      Ver
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      loading={descargarInforme.isPending && descargarInforme.variables === numero}
                      onClick={() => descargarInforme.mutate(numero)}
                    >
                      Descargar
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {seleccionado ? (
        <Section
          title={INFORMES.find((fila) => fila.numeros.includes(seleccionado))?.titulo ?? "Informe"}
          description={`${informe.data?.detalle?.length ?? 0} registros`}
        >
          {informe.isError ? (
            <Notice tono="danger" titulo="No se pudo cargar el informe">
              {mensajeDeError(informe.error)}
            </Notice>
          ) : null}
          <DataTable
            columnas={columnasDe(informe.data?.detalle ?? [])}
            filas={informe.data?.detalle ?? []}
            claveFila={(fila) => String(fila.id ?? JSON.stringify(fila))}
            cargando={informe.isLoading}
            vacio="No hay registros para el período seleccionado."
          />
        </Section>
      ) : null}
    </>
  );
}
