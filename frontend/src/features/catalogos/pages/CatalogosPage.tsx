import { useState, type FormEvent } from "react";
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
import { mensajeDeError } from "@/infrastructure/api/errors";
import { usePaginacion } from "@/shared/hooks/usePaginacion";

type Recurso = (typeof recursosCatalogo)[number]["endpoint"];

interface Formulario {
  id: number | null;
  nombre: string;
  grupo: string;
  factor: string;
  codigoPostal: string;
}

const VACIO: Formulario = { id: null, nombre: "", grupo: "", factor: "", codigoPostal: "" };

interface GrupoCatalogo {
  titulo: string;
  descripcion: string;
  recursos: Array<{ etiqueta: string; endpoint: Recurso }>;
}

const GRUPOS: GrupoCatalogo[] = [
  {
    titulo: "Provincias y ciudades",
    descripcion: "La Plata, Berisso, Ensenada.",
    recursos: [],
  },
  {
    titulo: "Grupo y factor (G y F)",
    descripcion: "O+, O-, A+, B+, AB+…",
    recursos: [{ etiqueta: "G y F", endpoint: "gruposFactor" }],
  },
  {
    titulo: "Obras sociales y médicos",
    descripcion: "IOMA · Dr. Gutierrez, Luis",
    recursos: [
      { etiqueta: "Obras sociales", endpoint: "obrasSociales" },
      { etiqueta: "Médicos", endpoint: "medicos" },
    ],
  },
  {
    titulo: "Determinaciones, antígenos, fenotipos y tipos",
    descripcion: "Serológicas/PCD, antígenos, fenotipos (R1r, rr) y tipos de transfusión.",
    recursos: [
      { etiqueta: "Serológicas", endpoint: "determinacionesSerologicas" },
      { etiqueta: "PCD", endpoint: "determinacionesPcd" },
      { etiqueta: "Antígenos", endpoint: "antigenos" },
      { etiqueta: "Fenotipos", endpoint: "fenotipos" },
      { etiqueta: "Tipos", endpoint: "tiposTransfusion" },
    ],
  },
];

function valorMuestra(item: ItemCatalogo): string {
  if (item.grupo) return `${item.grupo}${item.factor ?? ""}`;
  return item.nombre ?? "";
}

export function CatalogosPage() {
  const [recurso, setRecurso] = useState<Recurso>("gruposFactor");
  const [formulario, setFormulario] = useState<Formulario>(VACIO);
  const [provincia, setProvincia] = useState("");
  const queryClient = useQueryClient();
  const { pagina, porPagina, setPagina, params } = usePaginacion(recurso);

  const items = useQuery({
    queryKey: ["catalogos", recurso, pagina],
    queryFn: () => catalogosApi.listar(recurso, params),
  });
  const consolidado = useQuery({
    queryKey: ["catalogos", "consolidado"],
    queryFn: () => catalogosApi.consolidado(),
  });
  const provincias = useQuery({ queryKey: ["ubicaciones", "provincias"], queryFn: () => ubicacionesApi.provincias() });
  const ciudades = useQuery({
    queryKey: ["ubicaciones", "ciudades", provincia],
    queryFn: () => ubicacionesApi.ciudades(Number(provincia) || undefined),
    enabled: Boolean(provincia),
  });

  function seleccionar(endpoint: Recurso) {
    setRecurso(endpoint);
    setFormulario(VACIO);
  }

  function muestra(endpoint: Recurso): string {
    return (consolidado.data?.[endpoint] ?? [])
      .slice(0, 3)
      .map(valorMuestra)
      .filter(Boolean)
      .join(" · ");
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
        recurso === "gruposFactor"
          ? { grupo: formulario.grupo, factor: formulario.factor }
          : { nombre: formulario.nombre };
      if (recurso === "gruposFactor") return catalogosApi.crear(recurso, body);
      return formulario.id
        ? catalogosApi.actualizar(recurso, formulario.id, body)
        : catalogosApi.crear(recurso, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["catalogos"] });
      setFormulario(VACIO);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => catalogosApi.eliminar(recurso, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["catalogos"] });
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!guardar.isPending) guardar.mutate();
  }

  const columnas: Columna<ItemCatalogo>[] = [
    {
      clave: "nombre",
      titulo: "Valor",
      celda: (item) =>
        recurso === "gruposFactor"
          ? `${item.grupo ?? ""}${item.factor ?? ""}` || "—"
          : [item.nombre, item.codigoPostal].filter(Boolean).join(" · ") || "—",
    },
    {
      clave: "acciones",
      titulo: "ABM",
      celda: (item) => (
        <div className="action-links">
          <Button type="button" size="sm" variant="ghost" onClick={() => editar(item)}>Editar</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => eliminar.mutate(item.id)}>Eliminar</Button>
        </div>
      ),
    },
  ];

  const tituloRecurso = recursosCatalogo.find((entrada) => entrada.endpoint === recurso)?.titulo ?? "";
  const ubicacionesMuestra = (consolidado.data?.provincias ?? [])
    .slice(0, 3)
    .map((item) => item.nombre)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title="Catálogos maestros"
        subtitle="ABM de entidades de referencia del DER: ubicación, G y F, obras sociales, médicos, determinaciones, antígenos, fenotipos y tipos."
        actions={
          <Button type="button" variant="primary" onClick={() => setFormulario(VACIO)}>
            Nuevo registro
          </Button>
        }
      />

      <Section title="Entidades de referencia" description="Elegí el grupo a administrar">
        <div className="catalog-cards">
          {GRUPOS.map((grupo) => {
            const primera = grupo.recursos[0]?.endpoint;
            const valores = grupo.titulo === "Provincias y ciudades" ? ubicacionesMuestra : primera ? muestra(primera) : "";
            return (
              <div className="catalog-card" key={grupo.titulo}>
                <h3 className="catalog-card__title">{grupo.titulo}</h3>
                <p className="catalog-card__description">{grupo.descripcion}</p>
                <div className="catalog-card__values">{valores || "Sin registros cargados"}</div>
                <div className="catalog-card__resources">
                  {grupo.recursos.map((entrada) => (
                    <button
                      key={entrada.endpoint}
                      type="button"
                      className={`catalog-chip${recurso === entrada.endpoint ? " catalog-chip--active" : ""}`}
                      onClick={() => seleccionar(entrada.endpoint)}
                    >
                      {entrada.etiqueta}
                    </button>
                  ))}
                </div>
                <div className="catalog-card__footer">
                  {primera ? (
                    <Button type="button" size="sm" variant="ghost" onClick={() => seleccionar(primera)}>
                      ABM
                    </Button>
                  ) : (
                    <a className="btn btn--ghost btn--sm" href="#catalogo-ubicaciones">
                      ABM
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {(guardar.isError || eliminar.isError) ? (
        <Notice tono="danger" titulo="No se pudo completar la operación">
          {mensajeDeError(guardar.error ?? eliminar.error)}
        </Notice>
      ) : null}

      <Section title={`ABM · ${tituloRecurso}`} description="Alta, baja y modificación">
        <form onSubmit={enviar}>
          <div className="form-grid">
            {recurso === "gruposFactor" ? (
              <>
                <Field label="Grupo" htmlFor="catalogo-grupo" ancho={3}>
                  <input id="catalogo-grupo" className="input" value={formulario.grupo} onChange={(evento) => cambiar("grupo", evento.target.value)} placeholder="O" required />
                </Field>
                <Field label="Factor" htmlFor="catalogo-factor" ancho={3}>
                  <input id="catalogo-factor" className="input" value={formulario.factor} onChange={(evento) => cambiar("factor", evento.target.value)} placeholder="+" required />
                </Field>
              </>
            ) : (
              <Field label="Nombre" htmlFor="catalogo-nombre" ancho={6}>
                <input id="catalogo-nombre" className="input" value={formulario.nombre} onChange={(evento) => cambiar("nombre", evento.target.value)} required />
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
      </Section>

      <div id="catalogo-ubicaciones">
        <Section title="Provincias y ciudades" description="La Plata, Berisso, Ensenada…">
          <div className="form-grid">
            <Field label="Provincia" htmlFor="catalogo-provincia" ancho={4}>
              <select id="catalogo-provincia" className="select" value={provincia} onChange={(evento) => setProvincia(evento.target.value)}>
                <option value="">Sin provincia</option>
                {(provincias.data?.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="link-list" style={{ marginTop: "var(--s-4)" }}>
            {(ciudades.data?.data ?? []).map((ciudad) => (
              <div className="link-list__item" key={ciudad.id}>
                <span>{ciudad.nombre}</span>
                <span className="muted mono">{ciudad.codigoPostal ?? "—"}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
