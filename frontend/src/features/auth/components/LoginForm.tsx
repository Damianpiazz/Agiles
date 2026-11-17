import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/ui/Field";
import { Notice } from "@/shared/components/ui/Notice";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { useAuth } from "../model/AuthContext";

const USUARIOS_DEMO: Record<string, string> = {
  "facundo pérez": "fperez",
  "facundo perez": "fperez",
  "paula suárez": "fperez",
  "paula suarez": "fperez",
  "usuario maternidad": "maternidad",
  administrador: "admin",
};

function resolverUsuario(valor: string): string {
  const normalizado = valor.trim().toLowerCase();
  return USUARIOS_DEMO[normalizado] ?? valor.trim();
}

export function LoginForm() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion({ usuario: resolverUsuario(usuario), password });
      const destino = searchParams.get("from");
      navigate(destino && destino.startsWith("/") ? destino : "/", { replace: true });
    } catch (errorInicio) {
      setError(mensajeDeError(errorInicio));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      {error ? <Notice tono="danger" titulo="No se pudo ingresar">{error}</Notice> : null}
      <div className="form-grid">
        <Field label="Nombre y apellido" htmlFor="login-usuario" ancho={12} required>
          <input
            id="login-usuario"
            className="input"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            placeholder="Ej.: Facundo Pérez"
            autoComplete="username"
            autoFocus
            required
          />
        </Field>
        <Field label="Contraseña" htmlFor="login-password" ancho={12} required>
          <input
            id="login-password"
            className="input"
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            placeholder="Ingresá tu contraseña"
            autoComplete="current-password"
            required
          />
        </Field>
      </div>
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={enviando}>
          Ingresar
        </Button>
      </div>
      <p className="auth-card__hint">
        Usuarios de desarrollo: admin, fperez y maternidad. Cada acción queda registrada para trazabilidad.
      </p>
    </form>
  );
}
