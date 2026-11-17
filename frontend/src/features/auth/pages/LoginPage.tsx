import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <section className="auth-card" aria-labelledby="titulo-login">
      <h1 className="auth-card__brand" id="titulo-login">
        Constantes
      </h1>
      <p className="auth-card__service">Servicio de Hemoterapia · Hospital de Las Flores</p>
      <div style={{ marginTop: "var(--s-8)" }}>
        <LoginForm />
      </div>
      <p className="auth-card__notice">
        Acceso exclusivo para personal autorizado. Cada acción queda registrada para trazabilidad.
      </p>
    </section>
  );
}
