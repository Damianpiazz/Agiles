import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import { donanteSchema, type DonanteForm } from "../schemas/donante";
import "../styles/AltaDonante.css";

type Campo = keyof DonanteForm;
type FormState = Record<Campo, string>;
type Errores = Partial<Record<Campo, string[]>>;
type Banner = { tipo: "ok" | "error"; texto: string } | null;

const formInicial: FormState = {
  nombre: "",
  apellido: "",
  dni: "",
  fechaNacimiento: "",
  lugarNacimiento: "",
  sexoBiologico: "",
  domicilio: "",
  codigoPostal: "",
  email: "",
  telefonoFijo: "",
  telefonoCelular: "",
};

export default function AltaDonante() {
  const [form, setForm] = useState<FormState>(formInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [enviando, setEnviando] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function errorDe(campo: Campo) {
    return errores[campo]?.[0];
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);

    const parsed = donanteSchema.safeParse(form);
    if (!parsed.success) {
      setErrores(z.flattenError(parsed.error).fieldErrors as Errores);
      setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/donantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 201) {
        const donante = await res.json();
        setForm(formInicial);
        setBanner({ tipo: "ok", texto: `Donante registrado con ID ${donante.id}.` });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.campos) {
        setErrores(data.campos as Errores);
        setBanner({ tipo: "error", texto: "Revisá los campos marcados." });
        return;
      }
      if (res.status === 409) {
        setBanner({ tipo: "error", texto: "El donante ya se encuentra registrado" });
        return;
      }
      setBanner({ tipo: "error", texto: data.error ?? "No se pudo completar el alta." });
    } catch {
      setBanner({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="alta">
      <header className="alta-header">
        <h1>Alta de donante</h1>
        <p>Registrá los datos filiatorios y de contacto del donante.</p>
      </header>

      {banner && (
        <div
          className={`alta-banner ${banner.tipo === "ok" ? "alta-banner-ok" : "alta-banner-error"}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Datos filiatorios</legend>
          <div className="alta-grid">
            <div className="alta-field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("nombre"))}
              />
              {errorDe("nombre") && <p className="alta-error">{errorDe("nombre")}</p>}
            </div>

            <div className="alta-field">
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("apellido"))}
              />
              {errorDe("apellido") && <p className="alta-error">{errorDe("apellido")}</p>}
            </div>

            <div className="alta-field">
              <label htmlFor="dni">DNI</label>
              <input
                id="dni"
                name="dni"
                inputMode="numeric"
                value={form.dni}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("dni"))}
              />
              {errorDe("dni") && <p className="alta-error">{errorDe("dni")}</p>}
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
              <label htmlFor="lugarNacimiento">Lugar de nacimiento</label>
              <input
                id="lugarNacimiento"
                name="lugarNacimiento"
                value={form.lugarNacimiento}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("lugarNacimiento"))}
              />
              {errorDe("lugarNacimiento") && (
                <p className="alta-error">{errorDe("lugarNacimiento")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="sexoBiologico">Sexo biológico</label>
              <select
                id="sexoBiologico"
                name="sexoBiologico"
                value={form.sexoBiologico}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("sexoBiologico"))}
              >
                <option value="">Seleccioná una opción</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
              {errorDe("sexoBiologico") && (
                <p className="alta-error">{errorDe("sexoBiologico")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Domicilio y contacto</legend>
          <div className="alta-grid">
            <div className="alta-field">
              <label htmlFor="domicilio">Domicilio</label>
              <input
                id="domicilio"
                name="domicilio"
                value={form.domicilio}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("domicilio"))}
              />
              {errorDe("domicilio") && <p className="alta-error">{errorDe("domicilio")}</p>}
            </div>

            <div className="alta-field">
              <label htmlFor="codigoPostal">Código postal</label>
              <input
                id="codigoPostal"
                name="codigoPostal"
                value={form.codigoPostal}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("codigoPostal"))}
              />
              {errorDe("codigoPostal") && (
                <p className="alta-error">{errorDe("codigoPostal")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("email"))}
              />
              {errorDe("email") && <p className="alta-error">{errorDe("email")}</p>}
            </div>

            <div className="alta-field">
              <label htmlFor="telefonoFijo">
                Teléfono fijo <span className="alta-optional">(opcional)</span>
              </label>
              <input
                id="telefonoFijo"
                name="telefonoFijo"
                value={form.telefonoFijo}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("telefonoFijo"))}
              />
              {errorDe("telefonoFijo") && (
                <p className="alta-error">{errorDe("telefonoFijo")}</p>
              )}
            </div>

            <div className="alta-field">
              <label htmlFor="telefonoCelular">Teléfono celular</label>
              <input
                id="telefonoCelular"
                name="telefonoCelular"
                value={form.telefonoCelular}
                onChange={onChange}
                aria-invalid={Boolean(errorDe("telefonoCelular"))}
              />
              {errorDe("telefonoCelular") && (
                <p className="alta-error">{errorDe("telefonoCelular")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="alta-actions">
          <button type="submit" disabled={enviando}>
            {enviando ? "Registrando…" : "Registrar donante"}
          </button>
        </div>
      </form>
    </main>
  );
}