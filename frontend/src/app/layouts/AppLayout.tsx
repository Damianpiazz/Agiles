import { useEffect, useRef, useState, type FormEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/model/AuthContext";
import { Button } from "@/shared/components/ui/Button";
import { itemsParaRol } from "@/shared/constants/navegacion";
import { ROL_LABELS } from "@/shared/constants/roles";
import { cn } from "@/shared/lib/cn";

const GRUPOS = ["Operación", "Administración"] as const;

export function AppLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [termino, setTermino] = useState("");
  const busquedaRef = useRef<HTMLInputElement>(null);
  const items = itemsParaRol(usuario?.rol ?? null);

  useEffect(() => {
    function enfocarBusqueda(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        busquedaRef.current?.focus();
        busquedaRef.current?.select();
      }
    }
    window.addEventListener("keydown", enfocarBusqueda);
    return () => window.removeEventListener("keydown", enfocarBusqueda);
  }, []);

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valor = termino.trim();
    navigate(valor ? `/?q=${encodeURIComponent(valor)}` : "/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span>Constantes</span>
          <span className="topbar__tagline">Hemoterapia · Hospital de Las Flores</span>
        </div>
        <form className="topbar__search" onSubmit={buscar} role="search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={busquedaRef}
            aria-label="Buscar por DNI, nombre o historia clínica"
            value={termino}
            onChange={(evento) => setTermino(evento.target.value)}
            placeholder="Buscar por DNI, nombre o HC"
          />
          <kbd>Ctrl K</kbd>
        </form>
        <div className="topbar__context">
          <span>{usuario ? `${usuario.nombre} ${usuario.apellido}` : "Sistema"}</span>
          <span className="topbar__role">{usuario ? ROL_LABELS[usuario.rol] : ""}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              void cerrarSesion().then(() => navigate("/login", { replace: true }));
            }}
          >
            Salir
          </Button>
        </div>
      </header>

      <nav className="rail" aria-label="Navegación principal">
        {GRUPOS.map((grupo) => {
          const delGrupo = items.filter((item) => item.grupo === grupo);
          if (delGrupo.length === 0) return null;
          return (
            <div key={grupo}>
              <div className="rail__group-label">{grupo}</div>
              {delGrupo.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => cn("rail__link", isActive && "rail__link--active")}
                >
                  <span className="rail__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
        <div className="rail__footer">Registro de cargas con trazabilidad</div>
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
