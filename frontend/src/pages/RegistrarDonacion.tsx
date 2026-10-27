import { useState } from "react";
import type { FormEvent } from "react";
import { donacionSchema } from "../schemas/donacion";
import type { Donante } from "../types/donante";
import "../styles/RegistrarDonacion.css";

type Props = {
  donanteInicial: Pick<Donante, "id" | "nombre" | "apellido" | "dni">;
  onCargarEstudios?: (donacionId: number) => void;
};

type Banner = { tipo: "ok" | "error"; texto: string } | null;

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);
    setDonacionCreada(null);

    const parsed = donacionSchema.safeParse({
      donanteId: donanteInicial.id,
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
    <main className="donacion">
      <header className="donacion-header">
        <h1>Registrar donación</h1>
        <p>
          Asociá la extracción a un donante y dejá constancia del operador.
        </p>
      </header>

      {banner && (
        <div
          className={`donacion-banner ${banner.tipo === "ok" ? "donacion-banner-ok" : "donacion-banner-error"}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      {donacionCreada !== null && onCargarEstudios && (
        <div className="donacion-actions">
          <button
            type="button"
            onClick={() => onCargarEstudios(donacionCreada)}
          >
            Cargar PCI y Serología
          </button>
        </div>
      )}

      <fieldset>
        <legend>Donante</legend>
        <div className="donacion-donante">
          <strong>
            {donanteInicial.nombre} {donanteInicial.apellido}
          </strong>
          <p>DNI: {donanteInicial.dni}</p>
        </div>
      </fieldset>

      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Datos de la donación</legend>

          <div className="donacion-grid">
            <div className="donacion-field">
              <label htmlFor="operador">Operador</label>
              <input
                id="operador"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                aria-invalid={Boolean(banner && banner.tipo === "error" && !operador.trim())}
              />
            </div>

            <div className="donacion-field">
              <label htmlFor="fechaHora">Fecha y hora de la extracción</label>
              <input
                id="fechaHora"
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
              />
            </div>

            <div className="donacion-field">
              <label htmlFor="peso">
                Peso (kg) <span className="donacion-optional">(opcional)</span>
              </label>
              <input
                id="peso"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                inputMode="decimal"
              />
            </div>

            <div className="donacion-field">
              <label htmlFor="tensionArterial">
                Tensión arterial{" "}
                <span className="donacion-optional">(opcional)</span>
              </label>
              <input
                id="tensionArterial"
                value={tensionArterial}
                onChange={(e) => setTensionArterial(e.target.value)}
                placeholder="120/80"
              />
            </div>

            <div className="donacion-field">
              <label htmlFor="hemoglobina">
                Hemoglobina{" "}
                <span className="donacion-optional">(opcional)</span>
              </label>
              <input
                id="hemoglobina"
                value={hemoglobina}
                onChange={(e) => setHemoglobina(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="donacion-banderas">
            <label className="donacion-bandera" htmlFor="voluntario">
              <input
                id="voluntario"
                type="checkbox"
                checked={voluntario}
                onChange={(e) => setVoluntario(e.target.checked)}
              />
              Voluntario
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

          <div className="donacion-field">
            <label htmlFor="observaciones">
              Observaciones <span className="donacion-optional">(opcional)</span>
            </label>
            <input
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div className="donacion-actions">
            <button type="submit" disabled={enviando}>
              {enviando ? "Registrando…" : "Registrar donación"}
            </button>
          </div>
        </fieldset>
      </form>
    </main>
  );
}
