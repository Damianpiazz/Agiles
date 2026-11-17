import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import type { Persona } from "@/features/personas/types";
import { transfusionesApi } from "@/features/transfusiones/api/transfusiones.api";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { Section } from "@/shared/components/ui/Section";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import type { Transfusion } from "@/features/transfusiones/types";
import { fechaParaInput, formatoFecha, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

export function UnidadTransfusionalPage() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [termino, setTermino] = useState("");
  const [fecha, setFecha] = useState(fechaParaInput(new Date().toISOString()));
  const [lote, setLote] = useState("");
  const [fenotipo1, setFenotipo1] = useState("");
  const [fenotipo2, setFenotipo2] = useState("");
  const [tipoTransfusion, setTipoTransfusion] = useState("");
  const [pci, setPci] = useState("");
  const [pcd, setPcd] = useState("");
  const [rt, setRt] = useState("");
  const [tolerancia, setTolerancia] = useState("");
  const [tecnico, setTecnico] = useState("");
  const queryClient = useQueryClient();

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
  const registros = useQuery({
    queryKey: ["transfusiones", "persona", persona?.id],
    queryFn: () => transfusionesApi.porPersona(persona?.id ?? 0),
    enabled: Boolean(persona?.id),
  });

  const guardar = useMutation({
    mutationFn: () =>
      transfusionesApi.crear({
        idPersona: persona?.id ?? 0,
        fecha: fecha || null,
        numeroOLote: lote || undefined,
        rt: rt || undefined,
        tolerancia: tolerancia || undefined,
        pci: pci || undefined,
        pcd: pcd || undefined,
        tecnico: tecnico || undefined,
        idFenotipo1: Number(fenotipo1) || null,
        idFenotipo2: Number(fenotipo2) || null,
        idTipoTransfusion: Number(tipoTransfusion) || null,
        idGrupoFactor: persona?.idGrupoFactor ?? null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transfusiones", "persona", persona?.id] });
      await queryClient.invalidateQueries({ queryKey: ["personas"] });
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (persona && !guardar.isPending) guardar.mutate();
  }

  const columnas: Columna<Transfusion>[] = [
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "lote", titulo: "N° / Lote", celda: (item) => <span className="mono">{item.numeroOLote ?? "—"}</span> },
    { clave: "tipo", titulo: "Tipo", celda: (item) => item.tipoTransfusion?.nombre ?? "—" },
    { clave: "rt", titulo: "Compatibilidad (RT)", celda: (item) => item.rt ?? "—" },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (item) => {
        const estado = item.estadoCompatibilidad ?? "SIN_DATOS";
        return (
          <StatusChip tono={estado === "COMPATIBLE" ? "ok" : estado === "INCOMPATIBLE" ? "danger" : "warn"}>
            {estado === "COMPATIBLE" ? "Compatible" : estado === "INCOMPATIBLE" ? "Incompatible" : "Sin datos"}
          </StatusChip>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Unidad transfusional"
        subtitle="Registro de paciente, determinaciones, compatibilidad y hemocomponente transfundido."
      />

      <Section title="Paciente y determinaciones">
        <SelectorPersona
          valor={termino}
          onChange={setTermino}
          onSeleccionar={(encontrada) => {
            setPersona(encontrada);
            setTermino(nombreCompleto(encontrada));
          }}
          label="Apellido y nombre / DNI"
        />
        {persona ? (
          <div style={{ marginTop: "var(--s-4)" }}>
            <PersonBanner
              persona={persona}
              estado={presentacionSemaforo(persona.semaforo)}
              datosExtra={[`HC ${persona.historiaClinica ?? "—"}`]}
            />
            <p className="soft" style={{ marginTop: "var(--s-2)" }}>
              Grupo y factor: {grupoFactorLegible(persona.grupoFactor)}
            </p>
          </div>
        ) : null}
      </Section>

      <form onSubmit={enviar}>
        <Section title="Hemocomponente y resultado">
          {guardar.isError ? (
            <Notice tono="danger" titulo="No se pudo guardar el registro">
              {mensajeDeError(guardar.error)}
            </Notice>
          ) : null}
          {guardar.isSuccess ? (
            <Notice tono="info" titulo="Registro guardado">
              La transfusión quedó asociada a {nombreCompleto(persona)}.
            </Notice>
          ) : null}

          <div className="form-grid">
            <Field label="Fecha" htmlFor="transfusion-fecha" ancho={3}>
              <input id="transfusion-fecha" className="input" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
            </Field>
            <Field label="N° / Lote" htmlFor="transfusion-lote" ancho={3}>
              <input id="transfusion-lote" className="input input--data" value={lote} onChange={(evento) => setLote(evento.target.value)} placeholder="CG2026-00142" />
            </Field>
            <Field label="Tipo" htmlFor="transfusion-tipo" ancho={3}>
              <select id="transfusion-tipo" className="select" value={tipoTransfusion} onChange={(evento) => setTipoTransfusion(evento.target.value)}>
                <option value="">Sin tipo</option>
                {(catalogos.data?.tiposTransfusion ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Técnico responsable" htmlFor="transfusion-tecnico" ancho={3}>
              <input id="transfusion-tecnico" className="input" value={tecnico} onChange={(evento) => setTecnico(evento.target.value)} placeholder="Lic. Pérez, Ana" />
            </Field>
            <Field label="Fenotipo" htmlFor="transfusion-fenotipo1" ancho={3}>
              <select id="transfusion-fenotipo1" className="select" value={fenotipo1} onChange={(evento) => setFenotipo1(evento.target.value)}>
                <option value="">Sin fenotipo</option>
                {(catalogos.data?.fenotipos ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fenotipo 2" htmlFor="transfusion-fenotipo2" ancho={3}>
              <select id="transfusion-fenotipo2" className="select" value={fenotipo2} onChange={(evento) => setFenotipo2(evento.target.value)}>
                <option value="">Sin fenotipo</option>
                {(catalogos.data?.fenotipos ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="PCI" htmlFor="transfusion-pci" ancho={3}>
              <select id="transfusion-pci" className="select" value={pci} onChange={(evento) => setPci(evento.target.value)}>
                <option value="">Sin dato</option>
                <option value="Negativo">Negativo</option>
                <option value="Positivo">Positivo</option>
              </select>
            </Field>
            <Field label="PCD" htmlFor="transfusion-pcd" ancho={3}>
              <select id="transfusion-pcd" className="select" value={pcd} onChange={(evento) => setPcd(evento.target.value)}>
                <option value="">Sin dato</option>
                <option value="Negativo">Negativo</option>
                <option value="Positivo">Positivo</option>
              </select>
            </Field>
            <Field label="Compatibilidad (RT)" htmlFor="transfusion-rt" ancho={6}>
              <select id="transfusion-rt" className="select" value={rt} onChange={(evento) => setRt(evento.target.value)}>
                <option value="">Sin dato</option>
                <option value="Compatible">Compatible</option>
                <option value="Negativo">Negativo</option>
                <option value="Incompatible">Incompatible</option>
              </select>
            </Field>
            <Field label="Tolerancia" htmlFor="transfusion-tolerancia" ancho={6}>
              <select id="transfusion-tolerancia" className="select" value={tolerancia} onChange={(evento) => setTolerancia(evento.target.value)}>
                <option value="">Sin dato</option>
                <option value="Buena">Buena</option>
                <option value="Regular">Regular</option>
                <option value="Mala">Mala</option>
              </select>
            </Field>
          </div>

          <FormActions
            submitLabel="Guardar registro"
            loading={guardar.isPending}
            disabled={!persona}
            onCancel={() => {
              setPersona(null);
              setTermino("");
            }}
            extra={<Button type="button" onClick={() => registros.refetch()} disabled={!persona}>Actualizar historial</Button>}
          />
        </Section>
      </form>

      {persona ? (
        <Section title="Historial de transfusiones" description={nombreCompleto(persona)}>
          <DataTable
            columnas={columnas}
            filas={registros.data?.data ?? []}
            claveFila={(item) => item.id}
            cargando={registros.isLoading}
            error={registros.isError ? "No se pudo consultar el historial." : undefined}
            onReintentar={() => void registros.refetch()}
            claveReset={persona?.id}
          />
        </Section>
      ) : null}
    </>
  );
}
