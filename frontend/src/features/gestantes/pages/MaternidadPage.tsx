import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gestantesApi } from "@/features/gestantes/api/gestantes.api";
import { recienNacidosApi } from "@/features/gestantes/api/recien-nacidos.api";
import { personasApi } from "@/features/personas/api/personas.api";
import type { Persona } from "@/features/personas/types";
import { Field } from "@/shared/components/ui/Field";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { documentoLegible, formatoFecha, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

export function MaternidadPage() {
  const [termino, setTermino] = useState("");
  const [consulta, setConsulta] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);

  const resultados = useQuery({
    queryKey: ["personas", "buscar", consulta],
    queryFn: () => personasApi.buscar(consulta),
    enabled: consulta.length > 0,
  });

  const gestantes = useQuery({
    queryKey: ["gestantes", "persona", persona?.id],
    queryFn: () => gestantesApi.porPersona(persona?.id ?? 0),
    enabled: Boolean(persona?.id),
  });

  const recienNacidos = useQuery({
    queryKey: ["recien-nacidos", "madre", persona?.id],
    queryFn: () => recienNacidosApi.listar({ madreId: persona?.id ?? 0 }),
    enabled: Boolean(persona?.id),
  });

  const estudio = gestantes.data?.data?.[0];
  const rn = recienNacidos.data?.data?.[0];
  const pci = estudio?.pciAsociados?.[0]?.pci?.resultados?.[0]?.resultado;
  const conyugal = estudio?.pciAsociados?.[1]?.pci?.resultados?.[0]?.resultado;

  return (
    <>
      <PageHeader
        title="Consulta de estudios de gestantes"
        subtitle="Busque por DNI o nombre para ver el estado actualizado del estudio."
      />

      <Section title="Buscar paciente (DNI o nombre)">
        <SearchField
          label="Buscar paciente (DNI o nombre)"
          placeholder="Buscar por DNI, nombre o HC"
          value={termino}
          onChange={setTermino}
          onSubmit={() => setConsulta(termino.trim())}
        />
        {resultados.data && resultados.data.length > 0 ? (
          <div className="selector-list" role="listbox" aria-label="Pacientes encontrados">
            {resultados.data.slice(0, 6).map((encontrada) => (
              <button
                key={encontrada.id}
                type="button"
                className="selector-list__item"
                onClick={() => {
                  setPersona(encontrada);
                  setTermino(nombreCompleto(encontrada));
                }}
              >
                <span>
                  <strong>{nombreCompleto(encontrada)}</strong>
                  <span className="muted mono"> DNI {documentoLegible(encontrada.dni)}</span>
                </span>
                <span className="muted">{grupoFactorLegible(encontrada.grupoFactor)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </Section>

      {persona ? (
        <>
          <Section title="Resultado en tiempo real" description={`DNI ${documentoLegible(persona.dni)} · ${persona.sexoBiologico === "FEMENINO" ? "F" : "—"} · Gestante`}>
            <PersonBanner persona={persona} datosExtra={[`HC ${persona.historiaClinica ?? "—"}`]} />
            <div className="form-grid" style={{ marginTop: "var(--s-4)" }}>
              <Field label="Grupo y factor" ancho={3}>
                <p className="read-value">{grupoFactorLegible(estudio?.gestante?.grupoFactor ?? persona.grupoFactor)}</p>
              </Field>
              <Field label="PCI (Coombs indirecta)" ancho={3}>
                <p className="read-value">
                  <StatusChip tono={pci && /positiv|reactiv/i.test(pci) ? "danger" : "ok"}>
                    {pci ? `${pci} (Anti-D)` : "Pendiente"}
                  </StatusChip>
                </p>
              </Field>
              <Field label="Compatibilidad conyugal" ancho={3}>
                <p className="read-value">
                  <StatusChip tono={conyugal ? "warn" : "neutral"}>{conyugal ?? "Pendiente"}</StatusChip>
                </p>
              </Field>
              <Field label="Estudio RN" ancho={3}>
                <p className="read-value">
                  <StatusChip tono={rn ? "ok" : "warn"}>{rn ? "Cargado" : "Pendiente"}</StatusChip>
                </p>
              </Field>
            </div>

            {rn ? (
              <div className="form-grid" style={{ marginTop: "var(--s-4)" }}>
                <Field label="RN" ancho={3}>
                  <p className="read-value">{rn.rn ?? "—"}</p>
                </Field>
                <Field label="DNI RN" ancho={3}>
                  <p className="read-value mono">{documentoLegible(rn.dni)}</p>
                </Field>
                <Field label="GyF RN" ancho={3}>
                  <p className="read-value">{grupoFactorLegible(rn.grupoFactor)}</p>
                </Field>
                <Field label="IP anti-D" ancho={3}>
                  <p className="read-value">{rn.ipAntiD ?? "—"}</p>
                </Field>
              </div>
            ) : null}

            <p className="muted" style={{ marginTop: "var(--s-5)" }}>
              Última actualización: {estudio ? formatoFecha(estudio.fecha) : "Sin registros"} · Registrado por:{" "}
              {estudio?.operador || "Hemoterapia"}. Esta vista no permite editar ni exportar acciones de carga.
            </p>
          </Section>
        </>
      ) : (
        <Notice tono="info" titulo="Sin paciente seleccionado">
          Busque por DNI o nombre para ver el estado actualizado del estudio.
        </Notice>
      )}

      {persona && gestantes.data?.data?.length === 0 && recienNacidos.data?.data?.length === 0 ? (
        <Notice tono="warn" titulo="Sin estudios cargados">
          No hay estudios inmunohematológicos registrados para {nombreCompleto(persona)}.
        </Notice>
      ) : null}

    </>
  );
}
