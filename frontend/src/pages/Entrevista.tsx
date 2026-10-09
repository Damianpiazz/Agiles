import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  entrevistaSchema,
  preguntasParaSexo,
  type PreguntaCuestionario,
  type SeccionCuestionario,
} from "../schemas/entrevista";
import "../styles/Entrevista.css";

type Donante = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  sexoBiologico: "MASCULINO" | "FEMENINO";
};

type Respuesta = "SI" | "NO" | "";
type Banner = { tipo: "ok" | "error"; texto: string } | null;

type Props = {
  donanteInicial?: Donante | null;
};

function agruparPorSeccion(preguntas: PreguntaCuestionario[]) {
  const grupos: { seccion: SeccionCuestionario; preguntas: PreguntaCuestionario[] }[] =
    [];

  for (const pregunta of preguntas) {
    const ultimo = grupos[grupos.length - 1];
    if (!ultimo || ultimo.seccion !== pregunta.seccion) {
      grupos.push({ seccion: pregunta.seccion, preguntas: [pregunta] });
    } else {
      ultimo.preguntas.push(pregunta);
    }
  }

  return grupos;
}

function respuestasVacias(preguntas: PreguntaCuestionario[]) {
  return Object.fromEntries(preguntas.map((pregunta) => [pregunta.clave, ""])) as Record<
    string,
    Respuesta
  >;
}

export default function Entrevista({ donanteInicial = null }: Props) {
  const [dni, setDni] = useState(donanteInicial?.dni ?? "");
  const [donante, setDonante] = useState<Donante | null>(donanteInicial);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>(() =>
    donanteInicial
      ? respuestasVacias(preguntasParaSexo(donanteInicial.sexoBiologico))
      : {},
  );
  const [banner, setBanner] = useState<Banner>(null);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorCuestionario, setErrorCuestionario] = useState("");

  const preguntas = useMemo(
    () => (donante ? preguntasParaSexo(donante.sexoBiologico) : []),
    [donante],
  );
  const grupos = useMemo(() => agruparPorSeccion(preguntas), [preguntas]);

  async function buscarDonante(e: FormEvent) {
    e.preventDefault();
    setBanner(null);

    const dniLimpio = dni.trim();
    if (!/^\d{7,8}$/.test(dniLimpio)) {
      setBanner({ tipo: "error", texto: "Ingresá un DNI válido de 7 u 8 dígitos." });
      return;
    }

    setBuscando(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes?dni=${dniLimpio}`,
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setBanner({
          tipo: "error",
          texto: data?.error ?? "No se pudo buscar el donante.",
        });
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        setBanner({
          tipo: "error",
          texto: "No hay un donante registrado con ese DNI.",
        });
        return;
      }

      const encontrado = data[0] as Donante;
      setDonante(encontrado);
      setRespuestas(respuestasVacias(preguntasParaSexo(encontrado.sexoBiologico)));
    } catch {
      setBanner({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setBuscando(false);
    }
  }

  function cambiarDonante() {
    setDonante(null);
    setRespuestas({});
    setBanner(null);
    setErrorCuestionario("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!donante) return;

    setBanner(null);
    setErrorCuestionario("");

    const incompletas = preguntas.filter((pregunta) => !respuestas[pregunta.clave]);
    if (incompletas.length > 0) {
      setErrorCuestionario("Completá todas las preguntas del cuestionario.");
      setBanner({ tipo: "error", texto: "Revisá las preguntas pendientes." });
      return;
    }

    const parsed = entrevistaSchema.safeParse({ respuestas });

    if (!parsed.success) {
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        respuestas: Object.fromEntries(
          Object.entries(parsed.data.respuestas).map(([clave, valor]) => [
            clave,
            valor === "SI",
          ]),
        ),
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes/${donante.id}/entrevistas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        setRespuestas(respuestasVacias(preguntas));
        setBanner({
          tipo: "ok",
          texto: `Entrevista registrada. Donación N.º ${data.donacionId}. Podés cargar otra entrevista para este u otro donante.`,
        });
        return;
      }

      setBanner({
        tipo: "error",
        texto: data.error ?? "No se pudo guardar la entrevista.",
      });
    } catch {
      setBanner({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="entrevista">
      <header className="entrevista-header">
        <h1>Entrevista pre-donación</h1>
        <p>Registrá la evaluación individual de un donante ya existente</p>
      </header>

      {banner && (
        <div
          className={`entrevista-banner ${
            banner.tipo === "ok" ? "entrevista-banner-ok" : "entrevista-banner-error"
          }`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      {!donante && (
        <form onSubmit={buscarDonante} noValidate>
          <fieldset>
            <legend>Identificar donante</legend>
            <div className="entrevista-field">
              <label htmlFor="dniEntrevista">DNI</label>
              <input
                id="dniEntrevista"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
            </div>
          </fieldset>
          <div className="entrevista-actions">
            <button type="submit" disabled={buscando}>
              {buscando ? "Buscando…" : "Continuar"}
            </button>
          </div>
        </form>
      )}

      {donante && (
        <form onSubmit={onSubmit} noValidate>
          <fieldset>
            <legend>Donante</legend>
            <div className="entrevista-donante">
              <p>
                <strong>
                  {donante.nombre} {donante.apellido}
                </strong>
              </p>
              <p>DNI: {donante.dni}</p>
              <p>
                Sexo biológico:{" "}
                {donante.sexoBiologico === "MASCULINO" ? "Masculino" : "Femenino"}
              </p>
            </div>
            <button
              className="entrevista-secundario"
              type="button"
              onClick={cambiarDonante}
            >
              Elegir otro donante
            </button>
          </fieldset>

          {grupos.map((grupo) => (
            <fieldset key={grupo.seccion}>
              <legend>{grupo.seccion}</legend>
              {grupo.preguntas.map((pregunta) => (
                <div className="entrevista-pregunta" key={pregunta.clave}>
                  <p id={`pregunta-${pregunta.clave}`}>{pregunta.texto}</p>
                  <div
                    className="entrevista-opciones"
                    role="radiogroup"
                    aria-labelledby={`pregunta-${pregunta.clave}`}
                  >
                    <label>
                      <input
                        type="radio"
                        name={pregunta.clave}
                        value="SI"
                        checked={respuestas[pregunta.clave] === "SI"}
                        onChange={() =>
                          setRespuestas((prev) => ({
                            ...prev,
                            [pregunta.clave]: "SI",
                          }))
                        }
                      />
                      Sí
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={pregunta.clave}
                        value="NO"
                        checked={respuestas[pregunta.clave] === "NO"}
                        onChange={() =>
                          setRespuestas((prev) => ({
                            ...prev,
                            [pregunta.clave]: "NO",
                          }))
                        }
                      />
                      No
                    </label>
                  </div>
                </div>
              ))}
            </fieldset>
          ))}

          {errorCuestionario && (
            <p className="entrevista-error">{errorCuestionario}</p>
          )}

          <div className="entrevista-actions">
            <button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Registrar entrevista"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
