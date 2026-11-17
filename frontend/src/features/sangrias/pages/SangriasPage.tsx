import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import type { Persona } from "@/features/personas/types";
import { sangriasApi } from "@/features/sangrias/api/sangrias.api";
import type { Sangria } from "@/features/sangrias/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { fechaParaInput, formatoFecha, nombreCompleto } from "@/shared/utils/formato";

interface Formulario {
  id: number | null;
  idPersona: number | null;
  fecha: string;
  diagnostico: string;
  extraccion: string;
  reposicion: string;
  tecnico: string;
  idMedico: string;
  idObraSocial: string;
}

const FORMULARIO_VACIO: Formulario = {
  id: null,
  idPersona: null,
  fecha: fechaParaInput(new Date().toISOString()),
  diagnostico: "",
  extraccion: "",
  reposicion: "",
  tecnico: "",
  idMedico: "",
  idObraSocial: "",
};

export function SangriasPage() {
  const [termino, setTermino] = useState("");
  const [consulta, setConsulta] = useState("");
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [textoPersona, setTextoPersona] = useState("");
  const queryClient = useQueryClient();

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
  const lista = useQuery({
    queryKey: ["sangrias", "listar", consulta],
    queryFn: () => sangriasApi.listar(consulta ? { q: consulta, limit: 50 } : { limit: 50 }),
  });

  function cambiar(clave: keyof Formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [clave]: valor }));
  }

  function seleccionar(persona: Persona) {
    setFormulario((actual) => ({ ...actual, idPersona: persona.id }));
    setTextoPersona(nombreCompleto(persona));
  }

  function editar(item: Sangria) {
    setFormulario({
      id: item.id,
      idPersona: item.idPersona,
      fecha: fechaParaInput(item.fecha),
      diagnostico: item.diagnostico ?? "",
      extraccion: item.extraccion ?? "",
      reposicion: item.reposicion ?? "",
      tecnico: item.tecnico ?? "",
      idMedico: item.medico?.id ? String(item.medico.id) : "",
      idObraSocial: item.obraSocial?.id ? String(item.obraSocial.id) : "",
    });
    setTextoPersona(nombreCompleto(item.persona));
  }

  function limpiar() {
    setFormulario({ ...FORMULARIO_VACIO });
    setTextoPersona("");
  }

  const guardar = useMutation({
    mutationFn: () => {
      const datos = {
        idPersona: formulario.idPersona ?? 0,
        fecha: formulario.fecha || null,
        diagnostico: formulario.diagnostico || undefined,
        extraccion: formulario.extraccion || undefined,
        reposicion: formulario.reposicion || undefined,
        tecnico: formulario.tecnico || undefined,
        idMedico: Number(formulario.idMedico) || null,
        idObraSocial: Number(formulario.idObraSocial) || null,
      };
      return formulario.id ? sangriasApi.actualizar(formulario.id, datos) : sangriasApi.crear(datos);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sangrias"] });
      limpiar();
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (formulario.idPersona && !guardar.isPending) guardar.mutate();
  }

  const columnas: Columna<Sangria>[] = [
    { clave: "nombre", titulo: "Apellido y nombre", celda: (item) => nombreCompleto(item.persona) },
    { clave: "dni", titulo: "DNI", celda: (item) => <span className="muted mono">{item.persona?.dni ?? "—"}</span> },
    { clave: "diagnostico", titulo: "Diagnóstico", celda: (item) => item.diagnostico ?? "—" },
    { clave: "extraccion", titulo: "Extracción", celda: (item) => item.extraccion ?? "—" },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    {
      clave: "acciones",
      titulo: "Acciones",
      celda: (item) => (
        <div className="action-links">
          <Button type="button" size="sm" variant="ghost" onClick={() => editar(item)}>Ver · Editar</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sangrías terapéuticas"
        subtitle="Registro y consulta: paciente, indicación médica, diagnóstico, extracción y reposición."
        actions={
          <Button type="button" variant="primary" onClick={limpiar}>
            Nueva sangría
          </Button>
        }
      />

      <Section title="Buscar sangría, DNI o paciente">
        <SearchField
          label="Búsqueda"
          placeholder="Buscar por DNI, nombre o diagnóstico"
          value={termino}
          onChange={setTermino}
          onSubmit={() => setConsulta(termino.trim())}
        />
      </Section>

      <Section title="Registro" description="Datos del paciente y de la extracción">
        {guardar.isError ? (
          <Notice tono="danger" titulo="No se pudo guardar la sangría">
            {mensajeDeError(guardar.error)}
          </Notice>
        ) : null}
        <form onSubmit={enviar}>
          <div className="form-grid">
            <SelectorPersona valor={textoPersona} onChange={setTextoPersona} onSeleccionar={seleccionar} label="Apellido y nombre / DNI" />
            <Field label="Fecha" htmlFor="sangria-fecha" ancho={3}>
              <input id="sangria-fecha" className="input" type="date" value={formulario.fecha} onChange={(evento) => cambiar("fecha", evento.target.value)} />
            </Field>
            <Field label="Extracción" htmlFor="sangria-extraccion" ancho={3}>
              <input id="sangria-extraccion" className="input input--data" value={formulario.extraccion} onChange={(evento) => cambiar("extraccion", evento.target.value)} placeholder="450 ml" />
            </Field>
            <Field label="Diagnóstico" htmlFor="sangria-diagnostico" ancho={4}>
              <input id="sangria-diagnostico" className="input" value={formulario.diagnostico} onChange={(evento) => cambiar("diagnostico", evento.target.value)} placeholder="Hemocromatosis" />
            </Field>
            <Field label="Reposición" htmlFor="sangria-reposicion" ancho={4}>
              <input id="sangria-reposicion" className="input" value={formulario.reposicion} onChange={(evento) => cambiar("reposicion", evento.target.value)} />
            </Field>
            <Field label="Técnico" htmlFor="sangria-tecnico" ancho={4}>
              <input id="sangria-tecnico" className="input" value={formulario.tecnico} onChange={(evento) => cambiar("tecnico", evento.target.value)} placeholder="Lic. Torres, Juan" />
            </Field>
            <Field label="Médico" htmlFor="sangria-medico" ancho={4}>
              <select id="sangria-medico" className="select" value={formulario.idMedico} onChange={(evento) => cambiar("idMedico", evento.target.value)}>
                <option value="">Sin médico</option>
                {(catalogos.data?.medicos ?? []).map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Obra social" htmlFor="sangria-obra" ancho={4}>
              <select id="sangria-obra" className="select" value={formulario.idObraSocial} onChange={(evento) => cambiar("idObraSocial", evento.target.value)}>
                <option value="">Sin obra social</option>
                {(catalogos.data?.obrasSociales ?? []).map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </Field>
            <div className="field field--12">
              <FormActions
                submitLabel={formulario.id ? "Guardar cambios" : "Nueva sangría"}
                loading={guardar.isPending}
                disabled={!formulario.idPersona}
                onCancel={limpiar}
              />
            </div>
          </div>
        </form>
      </Section>

      <Section title="Sangrías registradas" description="Consultá y editá los registros existentes">
        <DataTable
          columnas={columnas}
          filas={lista.data?.data ?? []}
          claveFila={(item) => item.id}
          cargando={lista.isLoading}
          error={lista.isError ? "No se pudo consultar el listado de sangrías." : undefined}
          onReintentar={() => void lista.refetch()}
        />
      </Section>
    </>
  );
}
