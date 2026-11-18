import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
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
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import { cn } from "@/shared/lib/cn";
import {
  documentoLegible,
  fechaParaInput,
  formatoFecha,
  nombreCompleto,
} from "@/shared/utils/formato";

type Seccion = "registro" | "sangrias";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get("seccion");
  const seccion: Seccion = seccionParam === "sangrias" ? "sangrias" : "registro";

  const q = searchParams.get("q")?.trim() ?? "";
  const dni = searchParams.get("dni")?.trim() ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const idMedico = searchParams.get("idMedico") ?? "";
  const idObraSocial = searchParams.get("idObraSocial") ?? "";
  const claveFiltros = `${q}|${dni}|${desde}|${hasta}|${idMedico}|${idObraSocial}`;

  const [termino, setTermino] = useState(searchParams.get("q") ?? "");
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [textoPersona, setTextoPersona] = useState("");
  const queryClient = useQueryClient();
  const { pagina, porPagina, setPagina, params } = usePaginacion(claveFiltros);

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });
  const lista = useQuery({
    queryKey: ["sangrias", "listar", claveFiltros, pagina],
    queryFn: () =>
      sangriasApi.listar({
        ...params,
        ...(q ? { q } : {}),
        ...(dni ? { dni } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
        ...(idMedico ? { idMedico } : {}),
        ...(idObraSocial ? { idObraSocial } : {}),
      }),
    enabled: seccion === "sangrias",
  });

  function actualizarParametros(cambios: Record<string, string | null>) {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === "") siguientes.delete(clave);
        else siguientes.set(clave, valor);
      }
      return siguientes;
    });
  }

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
    actualizarParametros({ seccion: "registro" });
  }

  function limpiar() {
    setFormulario({ ...FORMULARIO_VACIO });
    setTextoPersona("");
  }

  function nuevaSangria() {
    limpiar();
    actualizarParametros({ seccion: "registro" });
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
    {
      clave: "dni",
      titulo: "DNI",
      celda: (item) => <span className="mono">{documentoLegible(item.persona?.dni)}</span>,
    },
    { clave: "diagnostico", titulo: "Diagnóstico", celda: (item) => item.diagnostico ?? "—" },
    { clave: "extraccion", titulo: "Extracción", celda: (item) => item.extraccion ?? "—" },
    { clave: "reposicion", titulo: "Reposición", celda: (item) => item.reposicion ?? "—" },
    { clave: "fecha", titulo: "Fecha", celda: (item) => formatoFecha(item.fecha) },
    { clave: "tecnico", titulo: "Técnico", celda: (item) => item.tecnico ?? "—" },
    { clave: "medico", titulo: "Médico", celda: (item) => item.medico?.nombre ?? "—" },
    { clave: "obraSocial", titulo: "Obra social", celda: (item) => item.obraSocial?.nombre ?? "—" },
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
          <Button type="button" variant="primary" onClick={nuevaSangria}>
            Nueva sangría
          </Button>
        }
      />

      <div className="section-tabs" role="tablist" aria-label="Secciones de Sangrías">
        {(
          [
            ["registro", "Registro"],
            ["sangrias", "Sangrías"],
          ] as const
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={seccion === id}
            aria-controls={`panel-${id}`}
            className={cn("section-tabs__tab", seccion === id && "section-tabs__tab--activo")}
            onClick={() => actualizarParametros({ seccion: id })}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-registro" aria-labelledby="tab-registro" hidden={seccion !== "registro"}>
        {seccion === "registro" ? (
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
        ) : null}
      </div>

      <div role="tabpanel" id="panel-sangrias" aria-labelledby="tab-sangrias" hidden={seccion !== "sangrias"}>
        {seccion === "sangrias" ? (
          <>
            <Section title="Buscar sangría, DNI o paciente">
              <SearchField
                label="Búsqueda"
                placeholder="Buscar por DNI, nombre o diagnóstico"
                value={termino}
                onChange={setTermino}
                onSubmit={() => {
                  actualizarParametros({ q: termino.trim() || null });
                  setPagina(1);
                }}
              />
            </Section>

            <Section title="Filtros">
              <div className="form-grid">
                <Field label="DNI" htmlFor="filtro-sangria-dni" ancho={3}>
                  <input
                    id="filtro-sangria-dni"
                    className="input input--data"
                    value={dni}
                    onChange={(evento) => actualizarParametros({ dni: evento.target.value || null })}
                    placeholder="DNI del paciente"
                  />
                </Field>
                <Field label="Médico" htmlFor="filtro-sangria-medico" ancho={3}>
                  <select
                    id="filtro-sangria-medico"
                    className="select"
                    value={idMedico}
                    onChange={(evento) => actualizarParametros({ idMedico: evento.target.value || null })}
                  >
                    <option value="">Todos</option>
                    {(catalogos.data?.medicos ?? []).map((item) => (
                      <option key={item.id} value={item.id}>{item.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Obra social" htmlFor="filtro-sangria-obra" ancho={3}>
                  <select
                    id="filtro-sangria-obra"
                    className="select"
                    value={idObraSocial}
                    onChange={(evento) => actualizarParametros({ idObraSocial: evento.target.value || null })}
                  >
                    <option value="">Todas</option>
                    {(catalogos.data?.obrasSociales ?? []).map((item) => (
                      <option key={item.id} value={item.id}>{item.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Desde" htmlFor="filtro-sangria-desde" ancho={3}>
                  <input
                    id="filtro-sangria-desde"
                    className="input"
                    type="date"
                    value={desde}
                    onChange={(evento) => actualizarParametros({ desde: evento.target.value || null })}
                  />
                </Field>
                <Field label="Hasta" htmlFor="filtro-sangria-hasta" ancho={3}>
                  <input
                    id="filtro-sangria-hasta"
                    className="input"
                    type="date"
                    value={hasta}
                    onChange={(evento) => actualizarParametros({ hasta: evento.target.value || null })}
                  />
                </Field>
                <div className="field field--12 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      actualizarParametros({
                        q: null,
                        dni: null,
                        desde: null,
                        hasta: null,
                        idMedico: null,
                        idObraSocial: null,
                      });
                      setTermino("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Section>

            <div id="sangrias">
              <Section title="Sangrías registradas" description="Consultá y editá los registros existentes">
                <div className="tabla-donaciones">
                  <DataTable
                    columnas={columnas}
                    filas={lista.data?.data ?? []}
                    claveFila={(item) => item.id}
                    cargando={lista.isLoading}
                    error={lista.isError ? "No se pudo consultar el listado de sangrías." : undefined}
                    onReintentar={() => void lista.refetch()}
                    meta={lista.data?.meta}
                    pagina={pagina}
                    porPagina={porPagina}
                    onCambiarPagina={setPagina}
                    claveReset={claveFiltros}
                  />
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
