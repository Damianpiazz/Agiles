import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { FormField, FormGrid, FormSection } from "../components/FormField";
import { FormSteps } from "../components/FormSteps";
import { PageHeader } from "../components/PageHeader";
import { SeleccionDonantesTable } from "../components/SeleccionDonantesTable";
import { useDonantesActivos } from "../hooks/useDatos";
import { donacionSchema } from "../schemas/donacion";
import type { Donante } from "../types/donante";
import "../styles/RegistrarDonacion.css";

type Props = {
  donanteInicial?: Pick<Donante, "id" | "nombre" | "apellido" | "dni"> | null;
  onCargarEstudios?: (donacionId: number) => void;
};

type Banner = { tipo: "ok" | "error"; texto: string } | null;

const PASOS = [
  "Donante y responsable",
  "Datos de extracción",
  "Modalidad y cierre",
] as const;

/** Devuelve la fecha y hora actual en el formato que consume <input type="datetime-local">. */
function ahoraLocal(): string {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function RegistrarDonacion({
  donanteInicial,
  onCargarEstudios,
}: Props) {
  const {
    datos: donantes,
    cargando: cargandoDonantes,
    error: errorDonantes,
  } = useDonantesActivos();
  const [donanteId, setDonanteId] = useState<number | "">(
    donanteInicial?.id ?? "",
  );
  const [operador, setOperador] = useState("");
  const [fechaHora, setFechaHora] = useState(ahoraLocal());
  const [peso, setPeso] = useState("");
  const [tensionArterial, setTensionArterial] = useState("");
  const [hemoglobina, setHemoglobina] = useState("");
  const [voluntario, setVoluntario] = useState(false);
  const [reposicion, setReposicion] = useState(false);
  const [autoExcluido, setAutoExcluido] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [enviando, setEnviando] = useState(false);
  const [donacionCreada, setDonacionCreada] = useState<number | null>(null);
  const [paso, setPaso] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const donanteSeleccionado =
    donantes.find((item) => item.id === donanteId) ?? donanteInicial ?? null;

  function seleccionarDonante(donante: Donante) {
    setDonanteId(donante.id);
    setBanner(null);
  }

  function siguiente(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    if (paso < PASOS.length - 1) {
      setPaso(paso + 1);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);
    setDonacionCreada(null);

    if (!donanteId) {
      setBanner({ tipo: "error", texto: "Seleccioná un donante antes de registrar la donación." });
      setPaso(0);
      document.getElementById("donanteId")?.focus();
      return;
    }

    const parsed = donacionSchema.safeParse({
      donanteId,
      operador,
      peso,
      tensionArterial,
      hemoglobina,
      voluntario,
      reposicion,
      autoExcluido,
      fechaHora: fechaHora ? new Date(fechaHora).toISOString() : undefined,
      observaciones,
    });

    if (!parsed.success) {
      setBanner({
        tipo: "error",
        texto: parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.",
      });
      const campo = parsed.error.issues[0]?.path[0];
      if (typeof campo === "string") document.getElementById(campo)?.focus();
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/donaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 201) {
        const donacion = await res.json();
        setBanner({
          tipo: "ok",
          texto: `Donación #${donacion.id} registrada (estado: ${donacion.estado}). Podés continuar con la calificación biológica.`,
        });
        setDonacionCreada(donacion.id);
        setOperador("");
        setFechaHora(ahoraLocal());
        setPeso("");
        setTensionArterial("");
        setHemoglobina("");
        setVoluntario(false);
        setReposicion(false);
        setAutoExcluido(false);
        setObservaciones("");
        setPaso(0);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setBanner({
        tipo: "error",
        texto: data.error ?? "No se pudo registrar la donación.",
      });
    } catch {
      setBanner({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="donacion">
      <PageHeader
        title="Registrar donación"
        description="Asociá la extracción a un donante y dejá constancia del operador."
      />

      {banner ? <Banner tone={banner.tipo}>{banner.texto}</Banner> : null}
      {errorDonantes ? <Banner tone="error">{errorDonantes}</Banner> : null}

      {donacionCreada !== null && onCargarEstudios ? (
        <div className="donacion-actions">
          <button
            type="button"
            onClick={() => onCargarEstudios(donacionCreada)}
          >
            Cargar PCI y Serología
          </button>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={paso === PASOS.length - 1 ? onSubmit : siguiente} noValidate>
        <FormSteps pasos={PASOS} actual={paso} />

        {paso === 0 ? (
          <FormSection title="Donante y responsable" description="Buscá y seleccioná al donante en la tabla, y confirmá quién registra la extracción.">
            <div id="donanteId" className="donacion-seleccion-donante" tabIndex={-1}>
              {donanteSeleccionado ? (
                <p className="donacion-seleccion-actual">
                  Donante seleccionado:{" "}
                  <strong>
                    {donanteSeleccionado.apellido}, {donanteSeleccionado.nombre}
                  </strong>{" "}
                  · DNI {donanteSeleccionado.dni}
                </p>
              ) : null}
              <SeleccionDonantesTable
                rows={donantes}
                loading={cargandoDonantes}
                selectedId={donanteId}
                onSelect={seleccionarDonante}
              />
            </div>

            <FormGrid columns={2}>
              <FormField id="operador" label="Operador" required>
                <input
                  id="operador"
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  aria-invalid={Boolean(banner && banner.tipo === "error" && !operador.trim())}
                />
              </FormField>

              <FormField id="fechaHora" label="Fecha y hora de la extracción">
                <input
                  id="fechaHora"
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                />
              </FormField>
            </FormGrid>
          </FormSection>
        ) : null}

        {paso === 1 ? (
          <FormSection title="Datos de extracción" description="Valores registrados durante la donación.">
            <FormGrid columns={3}>
              <FormField id="peso" label="Peso (kg)" optional>
                <input
                  id="peso"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  inputMode="decimal"
                />
              </FormField>

              <FormField id="tensionArterial" label="Tensión arterial" optional>
                <input
                  id="tensionArterial"
                  value={tensionArterial}
                  onChange={(e) => setTensionArterial(e.target.value)}
                  placeholder="120/80"
                />
              </FormField>

              <FormField id="hemoglobina" label="Hemoglobina" optional>
                <input
                  id="hemoglobina"
                  value={hemoglobina}
                  onChange={(e) => setHemoglobina(e.target.value)}
                  inputMode="decimal"
                />
              </FormField>
            </FormGrid>
          </FormSection>
        ) : null}

        {paso === 2 ? (
          <>
            <FormSection title="Modalidad de la donación">
              <div className="donacion-banderas">
                <label className="donacion-bandera" htmlFor="voluntario">
                  <input
                    id="voluntario"
                    type="checkbox"
                    checked={voluntario}
                    onChange={(e) => setVoluntario(e.target.checked)}
                  />
                  Voluntaria
                </label>

                <label className="donacion-bandera" htmlFor="reposicion">
                  <input
                    id="reposicion"
                    type="checkbox"
                    checked={reposicion}
                    onChange={(e) => setReposicion(e.target.checked)}
                  />
                  Reposición
                </label>

                <label className="donacion-bandera" htmlFor="autoExcluido">
                  <input
                    id="autoExcluido"
                    type="checkbox"
                    checked={autoExcluido}
                    onChange={(e) => setAutoExcluido(e.target.checked)}
                  />
                  Autoexcluido
                </label>
              </div>
            </FormSection>

            <FormSection title="Observaciones">
              <FormField id="observaciones" label="Observaciones" optional>
                <input
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </FormField>
            </FormSection>
          </>
        ) : null}

        <div className="ui-step-actions">
          {paso > 0 ? (
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => setPaso(paso - 1)}
            >
              Anterior
            </button>
          ) : null}
          <button type="submit" disabled={enviando}>
            {enviando
              ? "Registrando…"
              : paso < PASOS.length - 1
                ? "Siguiente"
                : "Registrar donación"}
          </button>
        </div>
      </form>
    </div>
  );
}
