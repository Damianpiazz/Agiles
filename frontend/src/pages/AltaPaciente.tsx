import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import { pacienteSchema, type PacienteForm } from "../schemas/paciente";
import "../styles/AltaDonante.css";

type Campo = keyof PacienteForm;
type FormState = Record<Campo, string>;
type Errores = Partial<Record<Campo, string[]>>;
type ResultadoAlta = {
  nombre: string;
  apellido: string;
  operador: string;
  createdAt: string;
};
type Banner =
  | { tipo: "ok"; texto: string; auditoria: string }
  | { tipo: "error"; texto: string }
  | null;

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const formInicial: FormState = {
  nombre: "",
  apellido: "",
  dni: "",
  fechaNacimiento: "",
  operador: "",
};

function esResultadoAlta(value: unknown): value is ResultadoAlta {
  if (!value || typeof value !== "object") return false;

  const resultado = value as Record<string, unknown>;
  return (
    typeof resultado.nombre === "string" &&
    typeof resultado.apellido === "string" &&
    typeof resultado.operador === "string" &&
    typeof resultado.createdAt === "string" &&
    !Number.isNaN(Date.parse(resultado.createdAt))
  );
}

export default function AltaPaciente() {
  const [form, setForm] = useState<FormState>(formInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [enviando, setEnviando] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function errorDe(campo: Campo) {
    return errores[campo]?.[0];
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);

    const parsed = pacienteSchema.safeParse(form);
    if (!parsed.success) {
      setErrores(z.flattenError(parsed.error).fieldErrors as Errores);
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const response = await fetch(`${API_URL}/api/pacientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 201) {
        setForm(formInicial);
        if (!esResultadoAlta(data)) {
          setBanner({
            tipo: "error",
            texto:
              "El alta fue confirmada, pero no se recibieron los datos de trazabilidad.",
          });
          return;
        }

        setBanner({
          tipo: "ok",
          texto: `Paciente ${data.nombre} ${data.apellido} registrado correctamente.`,
          auditoria: `Operador: ${data.operador} · Fecha y hora: ${new Date(data.createdAt).toLocaleString("es-AR")}`,
        });
        return;
      }

      if (response.status === 400 && data?.campos) {
        setErrores(data.campos as Errores);
        setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
        return;
      }

      if (response.status === 409) {
        setBanner({
          tipo: "error",
          texto: "Ya existe un paciente registrado con ese DNI.",
        });
        return;
      }

      setBanner({
        tipo: "error",
        texto: data?.error ?? "No se pudo completar el alta.",
      });
    } catch {
      setBanner({
        tipo: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="alta">
      <header className="alta-header">
        <h1>Alta de paciente</h1>
        <p>Registrá los datos de identificación del paciente o receptor.</p>
      </header>

      {banner && (
        <div
          className={`alta-banner ${banner.tipo === "ok" ? "alta-banner-ok" : "alta-banner-error"}`}
          role={banner.tipo === "error" ? "alert" : "status"}
        >
          <p>{banner.texto}</p>
          {banner.tipo === "ok" && <p>{banner.auditoria}</p>}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Datos de identificación</legend>
          <div className="alta-grid">
            <div className="alta-field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                autoComplete="given-name"
                value={form.nombre}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("nombre"))}
              />
              {errorDe("nombre") && (
                <p className="alta-error">{errorDe("nombre")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                autoComplete="family-name"
                value={form.apellido}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("apellido"))}
              />
              {errorDe("apellido") && (
                <p className="alta-error">{errorDe("apellido")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="dni">DNI</label>
              <input
                id="dni"
                name="dni"
                inputMode="numeric"
                autoComplete="off"
                value={form.dni}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("dni"))}
              />
              {errorDe("dni") && (
                <p className="alta-error">{errorDe("dni")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                max={hoy}
                value={form.fechaNacimiento}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("fechaNacimiento"))}
              />
              {errorDe("fechaNacimiento") && (
                <p className="alta-error">{errorDe("fechaNacimiento")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="operador">Operador responsable</label>
              <input
                id="operador"
                name="operador"
                autoComplete="name"
                value={form.operador}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("operador"))}
              />
              {errorDe("operador") && (
                <p className="alta-error">{errorDe("operador")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="alta-actions">
          <button type="submit" disabled={enviando}>
            {enviando ? "Registrando…" : "Registrar paciente"}
          </button>
        </div>
      </form>
    </main>
  );
}
