import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { FormSteps } from "../components/FormSteps";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/States";
import { pciFormSchema } from "../schemas/pci";
import { serologiaFormSchema } from "../schemas/serologia";
import type { Antigeno, DeterminacionSerologica } from "../types/estudio";
import "../styles/CargarEstudios.css";

const PASOS = [
  "Prueba de Coombs indirecta",
  "Serología",
] as const;

type Props = {
  donacionId: number;
  onVolver?: () => void;
};

type Banner = { tipo: "ok" | "error"; texto: string } | null;

type FilaPci = {
  id: string;
  antigenoId: string;
  resultado: string;
  intensidad: string;
  observacion: string;
};

type FilaSerologia = {
  id: string;
  determinacionSerologicaId: string;
  resultado: string;
  valor: string;
  unidad: string;
  observacion: string;
};

const RESULTADOS_PCI = ["Negativo", "Positivo", "Débil"];
const RESULTADOS_SEROLOGIA = ["No reactivo", "Reactivo"];

function filaPciVacia(): FilaPci {
  return {
    id: crypto.randomUUID(),
    antigenoId: "",
    resultado: RESULTADOS_PCI[0],
    intensidad: "",
    observacion: "",
  };
}

function filaSerologiaVacia(): FilaSerologia {
  return {
    id: crypto.randomUUID(),
    determinacionSerologicaId: "",
    resultado: RESULTADOS_SEROLOGIA[0],
    valor: "",
    unidad: "",
    observacion: "",
  };
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function horaAhora(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function CargarEstudios({ donacionId, onVolver }: Props) {
  const [antigenos, setAntigenos] = useState<Antigeno[]>([]);
  const [determinaciones, setDeterminaciones] = useState<
    DeterminacionSerologica[]
  >([]);
  const [catalogosError, setCatalogosError] = useState("");

  const [pciBanner, setPciBanner] = useState<Banner>(null);
  const [pciFecha, setPciFecha] = useState(fechaHoy());
  const [pciHora, setPciHora] = useState(horaAhora());
  const [pciObs, setPciObs] = useState("");
  const [pciFilas, setPciFilas] = useState<FilaPci[]>([filaPciVacia()]);
  const [enviandoPci, setEnviandoPci] = useState(false);

  const [serBanner, setSerBanner] = useState<Banner>(null);
  const [serFecha, setSerFecha] = useState(fechaHoy());
  const [serHora, setSerHora] = useState(horaAhora());
  const [serObs, setSerObs] = useState("");
  const [serFilas, setSerFilas] = useState<FilaSerologia[]>([
    filaSerologiaVacia(),
  ]);
  const [enviandoSer, setEnviandoSer] = useState(false);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    let activo = true;
    const api = import.meta.env.VITE_API_URL;

    async function cargarCatalogos() {
      try {
        const [resAnt, resDet] = await Promise.all([
          fetch(`${api}/api/catalogos/antigenos`),
          fetch(`${api}/api/catalogos/determinaciones-serologicas`),
        ]);

        if (!resAnt.ok || !resDet.ok) {
          throw new Error("respuesta no ok");
        }

        const [listaAnt, listaDet] = await Promise.all([
          resAnt.json(),
          resDet.json(),
        ]);

        if (activo) {
          setAntigenos(listaAnt);
          setDeterminaciones(listaDet);
        }
      } catch {
        if (activo) {
          setCatalogosError("No se pudieron cargar los catálogos.");
        }
      }
    }

    cargarCatalogos();
    return () => {
      activo = false;
    };
  }, []);

  function actualizarPci(indice: number, campo: keyof FilaPci, valor: string) {
    setPciFilas((prev) =>
      prev.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    );
  }

  function actualizarSer(
    indice: number,
    campo: keyof FilaSerologia,
    valor: string,
  ) {
    setSerFilas((prev) =>
      prev.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    );
  }

  async function enviarPci(e: FormEvent) {
    e.preventDefault();
    setPciBanner(null);

    const parsed = pciFormSchema.safeParse({
      fecha: pciFecha,
      hora: pciHora,
      observaciones: pciObs,
      resultados: pciFilas.map((fila) => ({
        antigenoId: Number(fila.antigenoId),
        resultado: fila.resultado,
        intensidad: fila.intensidad,
        observacion: fila.observacion,
      })),
    });

    if (!parsed.success) {
      setPciBanner({
        tipo: "error",
        texto:
          parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.",
      });
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("form [aria-invalid='true']")?.focus();
      });
      return;
    }

    setEnviandoPci(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pci`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, donacionIds: [donacionId] }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 201) {
        setPciBanner({
          tipo: "ok",
          texto: `PCI #${data.id} cargado correctamente.`,
        });
        setPciFilas([filaPciVacia()]);
        setPciObs("");
        return;
      }

      setPciBanner({
        tipo: "error",
        texto: data?.error ?? "No se pudo cargar el PCI.",
      });
    } catch {
      setPciBanner({
        tipo: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviandoPci(false);
    }
  }

  async function enviarSerologia(e: FormEvent) {
    e.preventDefault();
    setSerBanner(null);

    const parsed = serologiaFormSchema.safeParse({
      fecha: serFecha,
      hora: serHora,
      observaciones: serObs,
      resultados: serFilas.map((fila) => ({
        determinacionSerologicaId: Number(fila.determinacionSerologicaId),
        resultado: fila.resultado,
        valor: fila.valor,
        unidad: fila.unidad,
        observacion: fila.observacion,
      })),
    });

    if (!parsed.success) {
      setSerBanner({
        tipo: "error",
        texto:
          parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.",
      });
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("form [aria-invalid='true']")?.focus();
      });
      return;
    }

    setEnviandoSer(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/serologias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, donacionIds: [donacionId] }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 201) {
        setSerBanner({
          tipo: "ok",
          texto: `Serología #${data.id} cargada correctamente.`,
        });
        setSerFilas([filaSerologiaVacia()]);
        setSerObs("");
        return;
      }

      setSerBanner({
        tipo: "error",
        texto: data?.error ?? "No se pudo cargar la serología.",
      });
    } catch {
      setSerBanner({
        tipo: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviandoSer(false);
    }
  }

  return (
    <div className="estudios">
      <PageHeader
        title="Cargar estudios de calificación"
        eyebrow={`Donación #${donacionId}`}
        description="Cargá la Prueba de Coombs Indirecta (PCI) y la serología de la donación."
        actions={
          onVolver ? (
            <button type="button" className="ui-btn ui-btn-secondary" onClick={onVolver}>
              Volver
            </button>
          ) : undefined
        }
      />

      {catalogosError ? <Banner tone="error">{catalogosError}</Banner> : null}

      <FormSteps pasos={PASOS} actual={paso} />

      {paso === 0 && (
      <form onSubmit={enviarPci} noValidate>
        <FormSection title="Prueba de Coombs indirecta (PCI)" description="Registrá fecha, hora y resultados por antígeno.">

          {pciBanner ? <Banner tone={pciBanner.tipo}>{pciBanner.texto}</Banner> : null}

          <FormGrid columns={3}>
            <FormField id="pciFecha" label="Fecha" required>
              <input
                id="pciFecha"
                type="date"
                value={pciFecha}
                onChange={(e) => setPciFecha(e.target.value)}
              />
            </FormField>

            <FormField id="pciHora" label="Hora" required>
              <input
                id="pciHora"
                type="time"
                value={pciHora}
                onChange={(e) => setPciHora(e.target.value)}
              />
            </FormField>

            <FormField id="pciObs" label="Observaciones" optional>
              <input
                id="pciObs"
                value={pciObs}
                onChange={(e) => setPciObs(e.target.value)}
              />
            </FormField>
          </FormGrid>

          <h3 className="estudios-subtitulo">Resultados por antígeno</h3>

          {antigenos.length === 0 && !catalogosError ? (
            <EmptyState title="Cargando catálogo de antígenos" description="Los antígenos disponibles se obtienen del servidor." />
          ) : null}

          {pciFilas.map((fila, i) => (
            <div className="estudios-fila" key={fila.id}>
              <div className="estudios-fila-grid">
                <FormField id={`pciAntigeno-${i}`} label="Antígeno" required>
                  <select
                    id={`pciAntigeno-${i}`}
                    value={fila.antigenoId}
                    onChange={(e) =>
                      actualizarPci(i, "antigenoId", e.target.value)
                    }
                    aria-invalid={Boolean(pciBanner?.tipo === "error") && !fila.antigenoId}
                  >
                    <option value="">Seleccioná…</option>
                    {antigenos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField id={`pciResultado-${i}`} label="Resultado" required>
                  <select
                    id={`pciResultado-${i}`}
                    value={fila.resultado}
                    onChange={(e) =>
                      actualizarPci(i, "resultado", e.target.value)
                    }
                  >
                    {RESULTADOS_PCI.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField id={`pciIntensidad-${i}`} label="Intensidad" optional>
                  <input
                    id={`pciIntensidad-${i}`}
                    value={fila.intensidad}
                    onChange={(e) =>
                      actualizarPci(i, "intensidad", e.target.value)
                    }
                  />
                </FormField>

                <FormField id={`pciObsFila-${i}`} label="Observación" optional>
                  <input
                    id={`pciObsFila-${i}`}
                    value={fila.observacion}
                    onChange={(e) =>
                      actualizarPci(i, "observacion", e.target.value)
                    }
                  />
                </FormField>
              </div>

              {pciFilas.length > 1 && (
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary"
                  onClick={() =>
                    setPciFilas((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  Quitar
                </button>
              )}
            </div>
          ))}

          <div className="ui-step-actions">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => setPciFilas((prev) => [...prev, filaPciVacia()])}
            >
              + Agregar antígeno
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => {
                setPaso(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Siguiente: serología
            </button>
            <button type="submit" disabled={enviandoPci || Boolean(catalogosError)}>
              {enviandoPci ? "Cargando…" : "Cargar PCI"}
            </button>
          </div>
        </FormSection>
      </form>
      )}

      {paso === 1 && (
      <form onSubmit={enviarSerologia} noValidate>
        <FormSection title="Serología" description="Registrá fecha, hora y resultados por determinación.">

          {serBanner ? <Banner tone={serBanner.tipo}>{serBanner.texto}</Banner> : null}

          <FormGrid columns={3}>
            <FormField id="serFecha" label="Fecha" required>
              <input
                id="serFecha"
                type="date"
                value={serFecha}
                onChange={(e) => setSerFecha(e.target.value)}
              />
            </FormField>

            <FormField id="serHora" label="Hora" required>
              <input
                id="serHora"
                type="time"
                value={serHora}
                onChange={(e) => setSerHora(e.target.value)}
              />
            </FormField>

            <FormField id="serObs" label="Observaciones" optional>
              <input
                id="serObs"
                value={serObs}
                onChange={(e) => setSerObs(e.target.value)}
              />
            </FormField>
          </FormGrid>

          <h3 className="estudios-subtitulo">Resultados por determinación</h3>

          {determinaciones.length === 0 && !catalogosError ? (
            <EmptyState title="Cargando catálogo de determinaciones" description="Las determinaciones disponibles se obtienen del servidor." />
          ) : null}

          {serFilas.map((fila, i) => (
            <div className="estudios-fila" key={fila.id}>
              <div className="estudios-fila-grid">
                <FormField id={`serDet-${i}`} label="Determinación" required>
                  <select
                    id={`serDet-${i}`}
                    value={fila.determinacionSerologicaId}
                    onChange={(e) =>
                      actualizarSer(
                        i,
                        "determinacionSerologicaId",
                        e.target.value,
                      )
                    }
                    aria-invalid={Boolean(serBanner?.tipo === "error") && !fila.determinacionSerologicaId}
                  >
                    <option value="">Seleccioná…</option>
                    {determinaciones.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField id={`serResultado-${i}`} label="Resultado" required>
                  <select
                    id={`serResultado-${i}`}
                    value={fila.resultado}
                    onChange={(e) =>
                      actualizarSer(i, "resultado", e.target.value)
                    }
                  >
                    {RESULTADOS_SEROLOGIA.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField id={`serValor-${i}`} label="Valor" optional>
                  <input
                    id={`serValor-${i}`}
                    value={fila.valor}
                    onChange={(e) =>
                      actualizarSer(i, "valor", e.target.value)
                    }
                  />
                </FormField>

                <FormField id={`serUnidad-${i}`} label="Unidad" optional>
                  <input
                    id={`serUnidad-${i}`}
                    value={fila.unidad}
                    onChange={(e) =>
                      actualizarSer(i, "unidad", e.target.value)
                    }
                  />
                </FormField>

                <FormField id={`serObsFila-${i}`} label="Observación" optional>
                  <input
                    id={`serObsFila-${i}`}
                    value={fila.observacion}
                    onChange={(e) =>
                      actualizarSer(i, "observacion", e.target.value)
                    }
                  />
                </FormField>
              </div>

              {serFilas.length > 1 && (
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary"
                  onClick={() =>
                    setSerFilas((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  Quitar
                </button>
              )}
            </div>
          ))}

          <div className="ui-step-actions">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() =>
                setSerFilas((prev) => [...prev, filaSerologiaVacia()])
              }
            >
              + Agregar determinación
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => {
                setPaso(0);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Anterior: PCI
            </button>
            <button
              type="submit"
              disabled={enviandoSer || Boolean(catalogosError)}
            >
              {enviandoSer ? "Cargando…" : "Cargar serología"}
            </button>
          </div>
        </FormSection>
      </form>
      )}
    </div>
  );
}
