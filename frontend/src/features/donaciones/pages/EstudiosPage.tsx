import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { donacionesApi } from "@/features/donaciones/api/donaciones.api";
import type { Donacion, EstudiosInput } from "@/features/donaciones/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SearchField } from "@/shared/components/ui/SearchField";
import { Section } from "@/shared/components/ui/Section";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { usePaginacion } from "@/shared/hooks/usePaginacion";
import { documentoLegible, fechaParaInput, formatoFecha, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

type Resultados = Record<number, { resultado: string; observacion: string }>;

const OPCIONES_RESULTADO = ["Negativo", "Positivo", "No reactivo", "Reactivo", "Indeterminado"];

function resultadosDesde(items: Array<{ id?: number; resultado: string; observacion?: string | null }> | undefined): Resultados {
  return (items ?? []).reduce<Resultados>((acumulado, item) => {
    if (item.id) acumulado[item.id] = { resultado: item.resultado, observacion: item.observacion ?? "" };
    return acumulado;
  }, {});
}

export function EstudiosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [termino, setTermino] = useState(searchParams.get("q") ?? "");
  const consulta = searchParams.get("q")?.trim() ?? "";
  const idDonacion = searchParams.get("donacion") ? Number(searchParams.get("donacion")) : null;
  const [segundaMuestra, setSegundaMuestra] = useState(true);
  const [fecha, setFecha] = useState(fechaParaInput(new Date().toISOString()));
  const [hora, setHora] = useState(new Date().toTimeString().slice(0, 5));
  const [operador, setOperador] = useState("");
  const [serologia1, setSerologia1] = useState<Resultados>({});
  const [serologia2, setSerologia2] = useState<Resultados>({});
  const [pci, setPci] = useState<Resultados>({});
  const queryClient = useQueryClient();
  const { pagina, porPagina, setPagina, params } = usePaginacion(consulta);

  const donaciones = useQuery({
    queryKey: ["donaciones", "listar", consulta, pagina],
    queryFn: () => donacionesApi.listar({ ...(consulta ? { q: consulta } : {}), ...params }),
  });

  const estudios = useQuery({
    queryKey: ["donaciones", "estudios", idDonacion],
    queryFn: () => donacionesApi.estudios(idDonacion ?? 0),
    enabled: idDonacion !== null && Number.isFinite(idDonacion),
  });

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });

  useEffect(() => {
    if (!estudios.data) return;
    setSerologia1(resultadosDesde(estudios.data.serologiaPrimera?.resultados));
    setSerologia2(resultadosDesde(estudios.data.serologiaSegunda?.resultados));
    setPci(resultadosDesde(estudios.data.pci?.resultados));
    setOperador(estudios.data.donacion.operador ?? "");
  }, [estudios.data]);

  function actualizar(destino: "serologia1" | "serologia2" | "pci", id: number, campo: "resultado" | "observacion", valor: string) {
    const setter = { serologia1: setSerologia1, serologia2: setSerologia2, pci: setPci }[destino];
    setter((actual) => ({ ...actual, [id]: { ...(actual[id] ?? { resultado: "", observacion: "" }), [campo]: valor } }));
  }

  function aInput(resultados: Resultados, clave: "determinacionSerologicaId" | "antigenoId") {
    return Object.entries(resultados)
      .filter(([, valor]) => valor.resultado.trim() !== "")
      .map(([id, valor]) => ({
        [clave]: Number(id),
        resultado: valor.resultado,
        observacion: valor.observacion || undefined,
      }));
  }

  const guardar = useMutation({
    mutationFn: () => {
      const input: EstudiosInput = {
        serologias: [
          {
            tipoMuestra: "PRIMERA",
            fecha,
            hora,
            operador: operador || undefined,
            resultados: aInput(serologia1, "determinacionSerologicaId") as Array<{
              determinacionSerologicaId: number;
              resultado: string;
              observacion?: string;
            }>,
          },
          ...(segundaMuestra
            ? [
                {
                  tipoMuestra: "SEGUNDA" as const,
                  fecha,
                  hora,
                  operador: operador || undefined,
                  resultados: aInput(serologia2, "determinacionSerologicaId") as Array<{
                    determinacionSerologicaId: number;
                    resultado: string;
                    observacion?: string;
                  }>,
                },
              ]
            : []),
        ],
        pci: {
          fecha,
          hora,
          operador: operador || undefined,
          resultados: aInput(pci, "antigenoId") as Array<{
            antigenoId: number;
            resultado: string;
            observacion?: string;
          }>,
        },
      };
      return donacionesApi.guardarEstudios(idDonacion ?? 0, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["donaciones", "estudios", idDonacion] });
      await queryClient.invalidateQueries({ queryKey: ["donaciones", "listar"] });
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (idDonacion !== null && !guardar.isPending) guardar.mutate();
  }

  const columnas: Columna<Donacion>[] = [
    { clave: "id", titulo: "Donación", celda: (donacion) => <span className="mono">DON-{donacion.id}</span> },
    { clave: "fecha", titulo: "Fecha", celda: (donacion) => formatoFecha(donacion.fecha) },
    {
      clave: "donante",
      titulo: "Donante (DNI)",
      celda: (donacion) => (
        <>
          {nombreCompleto(donacion.persona)} <span className="muted mono">({documentoLegible(donacion.persona?.dni)})</span>
        </>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (donacion) => {
        const codigo = donacion.estadoEstudios?.codigo ?? "PENDIENTE";
        return (
          <StatusChip tono={codigo === "COMPLETO" ? "ok" : codigo === "EN_CARGA" ? "warn" : "neutral"}>
            {donacion.estadoEstudios?.etiqueta ?? "Pendiente de carga"}
          </StatusChip>
        );
      },
    },
    {
      clave: "accion",
      titulo: "Acción",
      celda: (donacion) => (
        <Button type="button" size="sm" variant="ghost" onClick={() => setSearchParams({ q: consulta, donacion: String(donacion.id) })}>
          Abrir →
        </Button>
      ),
    },
  ];

  const determinaciones = catalogos.data?.determinacionesSerologicas ?? [];
  const antigenos = catalogos.data?.antigenos ?? [];
  const contexto = estudios.data;

  return (
    <>
      <PageHeader
        title="Donaciones, serologías y PCI"
        subtitle="Carga y edición de resultados para una donación específica. Carga diferida permitida en cualquier momento."
      />

      <Section title="Buscar donación, DNI o ID">
        <SearchField
          label="Donación / donante"
          placeholder="Buscar donación, DNI o ID"
          value={termino}
          onChange={setTermino}
          onSubmit={() => setSearchParams(termino.trim() ? { q: termino.trim() } : {})}
        />
      </Section>

      <Section title="Donaciones" description="Seleccioná una donación para cargar sus resultados">
        <DataTable
          columnas={columnas}
          filas={donaciones.data?.data ?? []}
          claveFila={(donacion) => donacion.id}
          cargando={donaciones.isLoading}
          error={donaciones.isError ? "No se pudo consultar el listado de donaciones." : undefined}
          seleccionada={idDonacion}
          onReintentar={() => void donaciones.refetch()}
          meta={donaciones.data?.meta}
          pagina={pagina}
          porPagina={porPagina}
          onCambiarPagina={setPagina}
        />
      </Section>

      {contexto ? (
        <>
          <Notice tono="info" titulo={`Contexto: DON-${contexto.donacion.id}`}>
            {nombreCompleto(contexto.persona)} (DNI {documentoLegible(contexto.persona?.dni)}) ·{" "}
            {formatoFecha(contexto.donacion.fecha)} · {contexto.donacion.voluntario ? "Voluntario" : contexto.donacion.reposicion ? "Reposición" : "Otro"} · G y F{" "}
            {grupoFactorLegible(contexto.grupoFactor)}
          </Notice>

          <form onSubmit={enviar}>
            <Section title={`Resultados para DON-${contexto.donacion.id}`} description="Der: Donaciones ↔ Serologías/Serología_resultados, PCI/PCI_resultado. Guardar actualiza solo esta donación.">
              <div className="form-grid">
                <Field label="Fecha" htmlFor="estudios-fecha" ancho={3}>
                  <input id="estudios-fecha" className="input" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
                </Field>
                <Field label="Hora" htmlFor="estudios-hora" ancho={3}>
                  <input id="estudios-hora" className="input input--data" type="time" value={hora} onChange={(evento) => setHora(evento.target.value)} />
                </Field>
                <Field label="Operador" htmlFor="estudios-operador" ancho={6}>
                  <input id="estudios-operador" className="input" value={operador} onChange={(evento) => setOperador(evento.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Serología · 1ra muestra" description="Seleccioná el resultado de cada determinación">
              {determinaciones.length === 0 ? <p className="soft">No hay determinaciones serológicas cargadas en catálogos.</p> : null}
              {determinaciones.map((item) => (
                <FilaResultado
                  key={item.id}
                  nombre={item.nombre ?? `Determinación ${item.id}`}
                  valor={serologia1[item.id]?.resultado ?? ""}
                  observacion={serologia1[item.id]?.observacion ?? ""}
                  onChange={(campo, valor) => actualizar("serologia1", item.id, campo, valor)}
                />
              ))}
            </Section>

            <Section
              title="Serología · 2da muestra"
              description="Habilitada cuando la 1ra muestra arroja un resultado dudoso"
              actions={
                <label className="checkbox">
                  <input type="checkbox" checked={segundaMuestra} onChange={(evento) => setSegundaMuestra(evento.target.checked)} />
                  Cargar 2da muestra
                </label>
              }
            >
              {segundaMuestra ? (
                determinaciones.map((item) => (
                  <FilaResultado
                    key={item.id}
                    nombre={item.nombre ?? `Determinación ${item.id}`}
                    valor={serologia2[item.id]?.resultado ?? ""}
                    observacion={serologia2[item.id]?.observacion ?? ""}
                    onChange={(campo, valor) => actualizar("serologia2", item.id, campo, valor)}
                  />
                ))
              ) : (
                <p className="soft">Sin segunda muestra.</p>
              )}
            </Section>

            <Section title="PCI (carga diferida)" description="Antígenos y resultados de la prueba de compatibilidad indirecta">
              {antigenos.length === 0 ? <p className="soft">No hay antígenos cargados en catálogos.</p> : null}
              {antigenos.map((item) => (
                <FilaResultado
                  key={item.id}
                  nombre={item.nombre ?? `Antígeno ${item.id}`}
                  valor={pci[item.id]?.resultado ?? ""}
                  observacion={pci[item.id]?.observacion ?? ""}
                  onChange={(campo, valor) => actualizar("pci", item.id, campo, valor)}
                />
              ))}
            </Section>

            {guardar.isError ? (
              <Notice tono="danger" titulo="No se pudieron guardar los resultados">
                {mensajeDeError(guardar.error)}
              </Notice>
            ) : null}
            {guardar.isSuccess ? (
              <Notice tono="info" titulo="Resultados guardados">
                La donación quedó actualizada. Estado: {guardar.data.estado.etiqueta}.
              </Notice>
            ) : null}

            <FormActions
              submitLabel="Guardar resultados"
              loading={guardar.isPending}
              disabled={idDonacion === null}
              onCancel={() => setSearchParams(consulta ? { q: consulta } : {})}
            />
          </form>
        </>
      ) : null}
    </>
  );
}

interface FilaResultadoProps {
  nombre: string;
  valor: string;
  observacion: string;
  onChange: (campo: "resultado" | "observacion", valor: string) => void;
}

function FilaResultado({ nombre, valor, observacion, onChange }: FilaResultadoProps) {
  return (
    <div className="resultado-row">
      <span className="resultado-row__nombre">{nombre}</span>
      <select className="select" value={valor} onChange={(evento) => onChange("resultado", evento.target.value)} aria-label={`Resultado de ${nombre}`}>
        <option value="">Sin carga</option>
        {OPCIONES_RESULTADO.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      <input
        className="input"
        value={observacion}
        onChange={(evento) => onChange("observacion", evento.target.value)}
        placeholder="Observación (opcional)"
        aria-label={`Observación de ${nombre}`}
      />
    </div>
  );
}
