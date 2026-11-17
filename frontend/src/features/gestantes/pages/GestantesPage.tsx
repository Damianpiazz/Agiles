import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import { gestantesApi } from "@/features/gestantes/api/gestantes.api";
import { recienNacidosApi } from "@/features/gestantes/api/recien-nacidos.api";
import type { Persona } from "@/features/personas/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { Section } from "@/shared/components/ui/Section";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import type { EstudioGestante, RecienNacido } from "@/features/gestantes/types";
import { documentoLegible, fechaParaInput, formatoFecha, nombreCompleto } from "@/shared/utils/formato";

const RESULTADOS = ["Negativo", "Positivo", "No reactivo", "Reactivo"];

function horaActual(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function GestantesPage() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [termino, setTermino] = useState("");
  const [fecha, setFecha] = useState(fechaParaInput(new Date().toISOString()));
  const [numero, setNumero] = useState("");
  const [operador, setOperador] = useState("");
  const [pciMadre, setPciMadre] = useState("");
  const [conyugal, setConyugal] = useState("");
  const [rnNombre, setRnNombre] = useState("");
  const [rnDni, setRnDni] = useState("");
  const [rnGrupoFactor, setRnGrupoFactor] = useState("");
  const [ipAntiD, setIpAntiD] = useState("");
  const [pcdRn, setPcdRn] = useState("");
  const [pciRn, setPciRn] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const queryClient = useQueryClient();

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
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

  const primerAntigeno = catalogos.data?.antigenos?.[0]?.id;
  const primeraDeterminacion = catalogos.data?.determinacionesPcd?.[0]?.id;

  const guardarGestante = useMutation({
    mutationFn: () =>
      gestantesApi.guardarCompleta({
        idPersona: persona?.id ?? 0,
        estudio: {
          numero: numero || undefined,
          fecha: fecha || null,
          operador: operador || undefined,
        },
        pci: pciMadre
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primerAntigeno ? [{ antigenoId: primerAntigeno, resultado: pciMadre }] : [],
            }
          : undefined,
        compatibilidadConyugal: conyugal
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primerAntigeno ? [{ antigenoId: primerAntigeno, resultado: conyugal }] : [],
            }
          : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gestantes", "persona", persona?.id] });
    },
  });

  const guardarRn = useMutation({
    mutationFn: () =>
      recienNacidosApi.guardarCompleta({
        estudio: {
          numero: numero || undefined,
          fecha: fecha || null,
          rn: rnNombre || undefined,
          dni: rnDni || undefined,
          idMadre: persona?.id ?? null,
          idGrupoFactor: Number(rnGrupoFactor) || null,
          ipAntiD: ipAntiD || undefined,
          operador: operador || undefined,
          observaciones: observaciones || undefined,
        },
        pci: pciRn
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primerAntigeno ? [{ antigenoId: primerAntigeno, resultado: pciRn }] : [],
            }
          : undefined,
        pcd: pcdRn
          ? {
              fecha,
              hora: horaActual(),
              operador: operador || undefined,
              resultados: primeraDeterminacion ? [{ idDeterminacionPcd: primeraDeterminacion, resultado: pcdRn }] : [],
            }
          : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recien-nacidos", "madre", persona?.id] });
    },
  });

  function seleccionar(encontrada: Persona) {
    setPersona(encontrada);
    setTermino(nombreCompleto(encontrada));
  }

  function limpiar() {
    setPersona(null);
    setTermino("");
  }

  const columnasGestante: Columna<EstudioGestante>[] = [
    { clave: "numero", titulo: "N°", celda: (item) => <span className="mono">{item.numero ?? "—"}</span> },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "operador", titulo: "Operador", celda: (item) => item.operador ?? "—" },
    { clave: "pci", titulo: "PCI", celda: (item) => item.pciAsociados?.[0]?.pci?.resultados?.[0]?.resultado ?? "Sin dato" },
  ];

  const columnasRn: Columna<RecienNacido>[] = [
    { clave: "rn", titulo: "RN", celda: (item) => item.rn ?? "—" },
    { clave: "dni", titulo: "DNI RN", celda: (item) => <span className="mono">{documentoLegible(item.dni)}</span> },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "ip", titulo: "IP anti-D", celda: (item) => item.ipAntiD ?? "—" },
  ];

  return (
    <>
      <PageHeader
        title="Gestantes y recién nacidos"
        subtitle="Estudios inmunohematológicos, antecedentes obstétricos, compatibilidad conyugal y estudios de RN."
      />

      <Section title="Paciente">
        <SelectorPersona valor={termino} onChange={setTermino} onSeleccionar={seleccionar} label="Paciente / madre" />
        {persona ? (
          <div style={{ marginTop: "var(--s-4)" }}>
            <PersonBanner
              persona={persona}
              estado={presentacionSemaforo(persona.semaforo)}
              datosExtra={[`HC ${persona.historiaClinica ?? "—"}`]}
            />
            <Button type="button" size="sm" variant="ghost" onClick={limpiar} style={{ marginTop: "var(--s-2)" }}>
              Cambiar paciente
            </Button>
          </div>
        ) : null}
      </Section>

      <form
        onSubmit={(evento: FormEvent<HTMLFormElement>) => {
          evento.preventDefault();
          if (persona && !guardarGestante.isPending) guardarGestante.mutate();
        }}
      >
        <Section title="Estudio de gestante" description="PCI (Coombs indirecta) y compatibilidad conyugal">
          {guardarGestante.isError ? (
            <Notice tono="danger" titulo="No se pudo guardar el estudio de gestante">
              {mensajeDeError(guardarGestante.error)}
            </Notice>
          ) : null}
          <div className="form-grid">
            <Field label="N° de estudio" htmlFor="gestante-numero" ancho={3}>
              <input id="gestante-numero" className="input" value={numero} onChange={(evento) => setNumero(evento.target.value)} />
            </Field>
            <Field label="Fecha" htmlFor="gestante-fecha" ancho={3}>
              <input id="gestante-fecha" className="input" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
            </Field>
            <Field label="Operador" htmlFor="gestante-operador" ancho={3}>
              <input id="gestante-operador" className="input" value={operador} onChange={(evento) => setOperador(evento.target.value)} />
            </Field>
            <Field label="PCI (Coombs indirecta)" htmlFor="gestante-pci" ancho={3}>
              <select id="gestante-pci" className="select" value={pciMadre} onChange={(evento) => setPciMadre(evento.target.value)}>
                <option value="">Pendiente de carga</option>
                {RESULTADOS.map((resultado) => (
                  <option key={resultado} value={resultado}>{resultado}</option>
                ))}
              </select>
            </Field>
            <Field label="Compatibilidad conyugal" htmlFor="gestante-conyugal" ancho={6}>
              <select id="gestante-conyugal" className="select" value={conyugal} onChange={(evento) => setConyugal(evento.target.value)}>
                <option value="">Pendiente de carga</option>
                {RESULTADOS.map((resultado) => (
                  <option key={resultado} value={resultado}>{resultado}</option>
                ))}
              </select>
            </Field>
          </div>
          <FormActions submitLabel="Guardar estudios" loading={guardarGestante.isPending} disabled={!persona} />
        </Section>
      </form>

      {persona ? (
        <Section title="Estudios de gestante registrados">
          <DataTable
            columnas={columnasGestante}
            filas={gestantes.data?.data ?? []}
            claveFila={(item) => item.id}
            cargando={gestantes.isLoading}
            onReintentar={() => void gestantes.refetch()}
          />
        </Section>
      ) : null}

      <form
        onSubmit={(evento: FormEvent<HTMLFormElement>) => {
          evento.preventDefault();
          if (persona && !guardarRn.isPending) guardarRn.mutate();
        }}
      >
        <Section title="Estudio de recién nacido" description="Datos del RN, PCD, PCI y profilaxis con IP anti-D">
          {guardarRn.isError ? (
            <Notice tono="danger" titulo="No se pudo guardar el estudio del RN">
              {mensajeDeError(guardarRn.error)}
            </Notice>
          ) : null}
          <div className="form-grid">
            <Field label="RN" htmlFor="rn-nombre" ancho={4}>
              <input id="rn-nombre" className="input" value={rnNombre} onChange={(evento) => setRnNombre(evento.target.value)} placeholder="Fernández (RN)" />
            </Field>
            <Field label="DNI RN" htmlFor="rn-dni" ancho={4}>
              <input id="rn-dni" className="input input--data" value={rnDni} onChange={(evento) => setRnDni(evento.target.value)} />
            </Field>
            <Field label="GyF RN" htmlFor="rn-gf" ancho={4}>
              <select id="rn-gf" className="select" value={rnGrupoFactor} onChange={(evento) => setRnGrupoFactor(evento.target.value)}>
                <option value="">Sin grupo</option>
                {(catalogos.data?.gruposFactor ?? []).map((item) => (
                  <option key={item.id} value={item.id}>{[item.grupo, item.factor].filter(Boolean).join("")}</option>
                ))}
              </select>
            </Field>
            <Field label="PCD" htmlFor="rn-pcd" ancho={3}>
              <select id="rn-pcd" className="select" value={pcdRn} onChange={(evento) => setPcdRn(evento.target.value)}>
                <option value="">Pendiente</option>
                {RESULTADOS.map((resultado) => <option key={resultado} value={resultado}>{resultado}</option>)}
              </select>
            </Field>
            <Field label="PCI" htmlFor="rn-pci" ancho={3}>
              <select id="rn-pci" className="select" value={pciRn} onChange={(evento) => setPciRn(evento.target.value)}>
                <option value="">Pendiente</option>
                {RESULTADOS.map((resultado) => <option key={resultado} value={resultado}>{resultado}</option>)}
              </select>
            </Field>
            <Field label="IP anti-D" htmlFor="rn-ip" ancho={3}>
              <select id="rn-ip" className="select" value={ipAntiD} onChange={(evento) => setIpAntiD(evento.target.value)}>
                <option value="">Sin dato</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Observaciones" htmlFor="rn-observaciones" ancho={3}>
              <input id="rn-observaciones" className="input" value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} />
            </Field>
          </div>
          <FormActions submitLabel="Guardar estudio del RN" loading={guardarRn.isPending} disabled={!persona} />
        </Section>
      </form>

      {persona ? (
        <Section title="Recién nacidos registrados">
          <DataTable
            columnas={columnasRn}
            filas={recienNacidos.data?.data ?? []}
            claveFila={(item) => item.id}
            cargando={recienNacidos.isLoading}
            onReintentar={() => void recienNacidos.refetch()}
          />
        </Section>
      ) : null}
    </>
  );
}
