import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi, recursosCatalogo } from "@/features/catalogos/api/catalogos.api";
import type { ItemCatalogo } from "@/features/catalogos/types";
import { ubicacionesApi } from "@/features/personas/api/ubicaciones.api";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Section } from "@/shared/components/ui/Section";
import { cn } from "@/shared/lib/cn";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { usePaginacion } from "@/shared/hooks/usePaginacion";

type Recurso = (typeof recursosCatalogo)[number]["endpoint"];
type Seccion = "ubicaciones" | Recurso;

interface Formulario {
  id: number | null;
  nombre: string;
  grupo: string;
  factor: string;
  codigoPostal: string;
}

const VACIO: Formulario = { id: null, nombre: "", grupo: "", factor: "", codigoPostal: "" };

const SECCIONES: Seccion[] = ["ubicaciones", ...recursosCatalogo.map((entrada) => entrada.endpoint)];

const ETIQUETAS: Record<Seccion, string> = {
  ubicaciones: "Ubicaciones",
  gruposFactor: "G y F",
  obrasSociales: "Obras sociales",
  medicos: "Médicos",
  determinacionesSerologicas: "Serológicas",
  determinacionesPcd: "PCD",
  antigenos: "Antígenos",
  fenotipos: "Fenotipos",
  tiposTransfusion: "Tipos",
};

const DESCRIPCIONES: Record<Recurso, string> = {
  gruposFactor: "Grupo sanguíneo y factor Rh.",
  obrasSociales: "Obras sociales de los pacientes.",
  medicos: "Profesionales que indican transfusiones y sangrías.",
  determinacionesSerologicas: "Determinaciones usadas en serologías.",
  determinacionesPcd: "Determinaciones usadas en pruebas de compatibilidad.",
  antigenos: "Antígenos para pruebas de Coombs indirecto.",
  fenotipos: "Fenotipos eritrocitarios (R1r, rr…).",
  tiposTransfusion: "Tipos de transfusión disponibles.",
};

function esSeccion(valor: string | null): valor is Seccion {
  return Boolean(valor && SECCIONES.includes(valor as Seccion));
}

export function CatalogosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get("seccion");
  const seccion: Seccion = esSeccion(seccionParam) ? seccionParam : "ubicaciones";
  const recurso = seccion === "ubicaciones" ? null : seccion;
  const recursoActivo = recurso ?? "gruposFactor";

  const [formulario, setFormulario] = useState<Formulario>(VACIO);
  const [provincia, setProvincia] = useState("");
  const [nombreProvincia, setNombreProvincia] = useState("");
  const [nombreCiudad, setNombreCiudad] = useState("");
  const [codigoPostalCiudad, setCodigoPostalCiudad] = useState("");
  const queryClient = useQueryClient();
  const { pagina, porPagina, setPagina, params } = usePaginacion(recursoActivo);

  const items = useQuery({
    queryKey: ["catalogos", recurso, pagina],
    queryFn: () => catalogosApi.listar(recursoActivo, params),
    enabled: recurso !== null,
  });
  const consolidado = useQuery({
    queryKey: ["catalogos", "consolidado"],
    queryFn: () => catalogosApi.consolidado(),
  });
  const provincias = useQuery({
    queryKey: ["ubicaciones", "provincias"],
    queryFn: () => ubicacionesApi.provincias(),
    enabled: seccion === "ubicaciones",
  });
  const ciudades = useQuery({
    queryKey: ["ubicaciones", "ciudades", provincia],
    queryFn: () => ubicacionesApi.ciudades(Number(provincia) || undefined),
    enabled: seccion === "ubicaciones" && Boolean(provincia),
  });

  function cambiarSeccion(id: Seccion) {
    setFormulario(VACIO);
    setSearchParams({ seccion: id });
  }

  function cantidad(id: Seccion): string {
    if (consolidado.isLoading) return "…";
    if (id === "ubicaciones") return String(consolidado.data?.provincias?.length ?? 0);
    return String(consolidado.data?.[id]?.length ?? 0);
  }

  function cambiar(clave: keyof Formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [clave]: valor }));
  }

  function editar(item: ItemCatalogo) {
    setFormulario({
      id: item.id,
      nombre: item.nombre ?? "",
      grupo: item.grupo ?? "",
      factor: item.factor ?? "",
      codigoPostal: item.codigoPostal ?? "",
    });
  }

  const guardar = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> =
        recursoActivo === "gruposFactor"
          ? { grupo: formulario.grupo, factor: formulario.factor }
          : { nombre: formulario.nombre };
      if (recursoActivo === "gruposFactor") return catalogosApi.crear(recursoActivo, body);
      return formulario.id
        ? catalogosApi.actualizar(recursoActivo, formulario.id, body)
        : catalogosApi.crear(recursoActivo, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["catalogos"] });
      setFormulario(VACIO);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => catalogosApi.eliminar(recursoActivo, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["catalogos"] });
    },
  });

  const crearProvincia = useMutation({
    mutationFn: () => ubicacionesApi.crearProvincia(nombreProvincia),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ubicaciones"] });
      await queryClient.invalidateQueries({ queryKey: ["catalogos"] });
      setNombreProvincia("");
    },
  });

  const crearCiudad = useMutation({
    mutationFn: () =>
      ubicacionesApi.crearCiudad({
        nombre: nombreCiudad,
        codigoPostal: codigoPostalCiudad || undefined,
        idProvincia: Number(provincia),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ubicaciones"] });
      await queryClient.invalidateQueries({ queryKey: ["catalogos"] });
      setNombreCiudad("");
      setCodigoPostalCiudad("");
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!guardar.isPending) guardar.mutate();
  }

  const columnasBase: Columna<ItemCatalogo>[] =
    recursoActivo === "gruposFactor"
      ? [
          { clave: "grupo", titulo: "Grupo", celda: (item) => item.grupo || "—" },
          { clave: "factor", titulo: "Factor", celda: (item) => item.factor || "—" },
        ]
      : [{ clave: "nombre", titulo: "Nombre", celda: (item) => item.nombre || "—" }];

  const columnas: Columna<ItemCatalogo>[] = [
    ...columnasBase,
    {
      clave: "acciones",
      titulo: "Acciones",
      celda: (item) => (
        <div className="action-links">
          <Button type="button" size="sm" variant="ghost" onClick={() => editar(item)}>Editar</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => eliminar.mutate(item.id)}>Eliminar</Button>
        </div>
      ),
    },
  ];

  const columnasCiudades: Columna<ItemCatalogo>[] = [
    { clave: "nombre", titulo: "Ciudad", celda: (item) => item.nombre || "—" },
    {
      clave: "codigoPostal",
      titulo: "Código postal",
      celda: (item) => <span className="mono">{item.codigoPostal || "—"}</span>,
    },
  ];

  const hayError = guardar.isError || eliminar.isError || crearProvincia.isError || crearCiudad.isError;
  const mensajeError = guardar.error ?? eliminar.error ?? crearProvincia.error ?? crearCiudad.error;
  const tituloSeccion =
    seccion === "ubicaciones"
      ? "Provincias y ciudades"
      : recursosCatalogo.find((entrada) => entrada.endpoint === recursoActivo)?.titulo ?? "Catálogo";
  const descripcionSeccion = seccion === "ubicaciones" ? "Ubicaciones de las personas." : DESCRIPCIONES[recursoActivo];

  return (
    <>
      <PageHeader
        title="Catálogos maestros"
        subtitle="ABM de entidades de referencia del DER: ubicación, G y F, obras sociales, médicos, determinaciones, antígenos, fenotipos y tipos."
      />

      <div className="section-tabs section-tabs--wrap" role="tablist" aria-label="Secciones de Catálogos">
        {SECCIONES.map((id) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={seccion === id}
            aria-controls={`panel-${seccion}`}
            className={cn("section-tabs__tab", seccion === id && "section-tabs__tab--activo")}
            onClick={() => cambiarSeccion(id)}
          >
            {ETIQUETAS[id]}
            <span className="section-tabs__count">{cantidad(id)}</span>
          </button>
        ))}
      </div>

      {hayError ? (
        <Notice tono="danger" titulo="No se pudo completar la operación">
          {mensajeDeError(mensajeError)}
        </Notice>
      ) : null}

      <div role="tabpanel" id={`panel-${seccion}`} aria-labelledby={`tab-${seccion}`}>
        {seccion === "ubicaciones" ? (
          <>
            <Section title="Provincias" description="Agregá provincias y elegí una para ver sus ciudades">
              <div className="form-grid">
                <Field label="Nueva provincia" htmlFor="catalogo-nueva-provincia" ancho={4}>
                  <input
                    id="catalogo-nueva-provincia"
                    className="input"
                    value={nombreProvincia}
                    onChange={(evento) => setNombreProvincia(evento.target.value)}
                    placeholder="Buenos Aires"
                  />
                </Field>
                <div className="field field--2 filtros__acciones">
                  <Button
                    type="button"
                    variant="ghost"
                    loading={crearProvincia.isPending}
                    disabled={!nombreProvincia.trim()}
                    onClick={() => crearProvincia.mutate()}
                  >
                    Agregar
                  </Button>
                </div>
                <Field label="Provincia" htmlFor="catalogo-provincia" ancho={4}>
                  <select
                    id="catalogo-provincia"
                    className="select"
                    value={provincia}
                    onChange={(evento) => setProvincia(evento.target.value)}
                  >
                    <option value="">Todas</option>
                    {(provincias.data?.data ?? []).map((item) => (
                      <option key={item.id} value={item.id}>{item.nombre}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Ciudades" description="Alta de ciudades y listado de la provincia seleccionada">
              <form
                onSubmit={(evento: FormEvent<HTMLFormElement>) => {
                  evento.preventDefault();
                  if (provincia && nombreCiudad.trim() && !crearCiudad.isPending) crearCiudad.mutate();
                }}
              >
                <div className="form-grid">
                  <Field label="Nombre" htmlFor="catalogo-nueva-ciudad" ancho={4}>
                    <input
                      id="catalogo-nueva-ciudad"
                      className="input"
                      value={nombreCiudad}
                      onChange={(evento) => setNombreCiudad(evento.target.value)}
                      placeholder="La Plata"
                    />
                  </Field>
                  <Field label="Código postal" htmlFor="catalogo-nuevo-cp" ancho={3}>
                    <input
                      id="catalogo-nuevo-cp"
                      className="input input--data"
                      value={codigoPostalCiudad}
                      onChange={(evento) => setCodigoPostalCiudad(evento.target.value)}
                      placeholder="1900"
                    />
                  </Field>
                  <div className="field field--4 filtros__acciones">
                    <Button type="submit" variant="primary" disabled={!provincia || !nombreCiudad.trim()}>
                      Agregar ciudad
                    </Button>
                  </div>
                </div>
              </form>
              <div style={{ marginTop: "var(--s-5)" }}>
                <DataTable
                  columnas={columnasCiudades}
                  filas={ciudades.data?.data ?? []}
                  claveFila={(item) => item.id}
                  cargando={ciudades.isLoading}
                  error={ciudades.isError ? "No se pudo consultar las ciudades." : undefined}
                  onReintentar={() => void ciudades.refetch()}
                  vacio={provincia ? "No hay ciudades cargadas para esta provincia." : "Seleccioná una provincia para ver sus ciudades."}
                />
              </div>
            </Section>
          </>
        ) : (
          <Section title={`ABM · ${tituloSeccion}`} description={descripcionSeccion}>
            <form onSubmit={enviar}>
              <div className="form-grid">
                {recursoActivo === "gruposFactor" ? (
                  <>
                    <Field label="Grupo" htmlFor="catalogo-grupo" ancho={3}>
                      <input
                        id="catalogo-grupo"
                        className="input"
                        value={formulario.grupo}
                        onChange={(evento) => cambiar("grupo", evento.target.value)}
                        placeholder="O"
                        required
                      />
                    </Field>
                    <Field label="Factor" htmlFor="catalogo-factor" ancho={3}>
                      <input
                        id="catalogo-factor"
                        className="input"
                        value={formulario.factor}
                        onChange={(evento) => cambiar("factor", evento.target.value)}
                        placeholder="+"
                        required
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Nombre" htmlFor="catalogo-nombre" ancho={6}>
                    <input
                      id="catalogo-nombre"
                      className="input"
                      value={formulario.nombre}
                      onChange={(evento) => cambiar("nombre", evento.target.value)}
                      required
                    />
                  </Field>
                )}
                <div className="field field--12">
                  <FormActions
                    submitLabel={formulario.id ? "Guardar cambios" : "Nuevo registro"}
                    loading={guardar.isPending}
                    onCancel={() => setFormulario(VACIO)}
                  />
                </div>
              </div>
            </form>

            <div style={{ marginTop: "var(--s-5)" }}>
              <DataTable
                columnas={columnas}
                filas={items.data?.data ?? []}
                claveFila={(item) => item.id}
                cargando={items.isLoading}
                error={items.isError ? "No se pudo consultar el catálogo." : undefined}
                onReintentar={() => void items.refetch()}
                meta={items.data?.meta}
                pagina={pagina}
                porPagina={porPagina}
                onCambiarPagina={setPagina}
              />
            </div>
          </Section>
        )}
      </div>
    </>
  );
}
