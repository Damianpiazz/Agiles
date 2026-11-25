import { lazy, Suspense, useEffect, useState } from "react";
import { LoadingState } from "./components/States";
import type { Donante } from "./types/donante";
import type { Vista } from "./types/navigation";
import "./App.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AltaDonante = lazy(() => import("./pages/AltaDonante"));
const AltaPaciente = lazy(() => import("./pages/AltaPaciente"));
const BuscarDonante = lazy(() => import("./pages/BuscarDonante"));
const BuscarPaciente = lazy(() => import("./pages/BuscarPaciente"));
const HistoriaPersona = lazy(() => import("./pages/HistoriaPersona"));
const RegistrarDonacion = lazy(() => import("./pages/RegistrarDonacion"));
const CargarEstudios = lazy(() => import("./pages/CargarEstudios"));
const SeleccionarDonacionEstudios = lazy(
  () => import("./pages/SeleccionarDonacionEstudios"),
);
const CalificacionBiologica = lazy(() => import("./pages/CalificacionBiologica"));
const TipificacionSanguinea = lazy(() => import("./pages/TipificacionSanguinea"));
const TamizajeInfecciones = lazy(() => import("./pages/TamizajeInfecciones"));
const ConsultaResultados = lazy(() => import("./pages/ConsultaResultados"));
const GestionSolicitudesTransfusion = lazy(
  () => import("./pages/GestionSolicitudesTransfusion"),
);
const EstudiosPretransfusionales = lazy(
  () => import("./pages/EstudiosPretransfusionales"),
);
const SeleccionarComponente = lazy(() => import("./pages/SeleccionarComponente"));
const EmitirSangre = lazy(() => import("./pages/EmitirSangre"));
const RecepcionUnidad = lazy(() => import("./pages/RecepcionUnidad"));
const LiberacionUnidad = lazy(() => import("./pages/LiberacionUnidad"));
const DarDeBajaUnidad = lazy(() => import("./pages/DarDeBajaUnidad"));

type NavItem = {
  vista: Vista;
  label: string;
  icon: string;
  group: string;
};

const NAV_ITEMS: NavItem[] = [
  { vista: "dashboard", label: "Resumen", icon: "◫", group: "Inicio" },
  { vista: "buscar", label: "Buscar donante", icon: "⌕", group: "Inicio" },
  { vista: "alta", label: "Alta de donante", icon: "＋", group: "Inicio" },
  {
    vista: "donacion",
    label: "Registrar donación",
    icon: "♥",
    group: "Donación y calificación",
  },
  {
    vista: "estudios",
    label: "Cargar PCI y Serología",
    icon: "✚",
    group: "Donación y calificación",
  },
  {
    vista: "calificacion",
    label: "Calificación biológica",
    icon: "✓",
    group: "Donación y calificación",
  },
  {
    vista: "tipificacion",
    label: "Tipificación sanguínea",
    icon: "⊕",
    group: "Donación y calificación",
  },
  {
    vista: "tamizaje",
    label: "Tamizaje de infecciones",
    icon: "◉",
    group: "Donación y calificación",
  },
  {
    vista: "consultaResultados",
    label: "Consultar resultados",
    icon: "⌕",
    group: "Donación y calificación",
  },
  {
    vista: "paciente",
    label: "Alta de paciente",
    icon: "＋",
    group: "Pacientes y transfusión",
  },
  {
    vista: "buscarPaciente",
    label: "Buscar paciente",
    icon: "⌕",
    group: "Pacientes y transfusión",
  },
  {
    vista: "historiaPersona",
    label: "Historia integral de persona",
    icon: "◷",
    group: "Pacientes y transfusión",
  },
  {
    vista: "solicitudesTransfusion",
    label: "Solicitudes de transfusión",
    icon: "▤",
    group: "Pacientes y transfusión",
  },
  {
    vista: "estudiosPretransfusionales",
    label: "Estudios pretransfusionales",
    icon: "◈",
    group: "Pacientes y transfusión",
  },
  {
    vista: "seleccionar",
    label: "Seleccionar componente",
    icon: "⚕",
    group: "Pacientes y transfusión",
  },
  {
    vista: "emision",
    label: "Emitir sangre",
    icon: "↗",
    group: "Pacientes y transfusión",
  },
  {
    vista: "recepcion",
    label: "Recepción de unidades",
    icon: "＋",
    group: "Inventario",
  },
  {
    vista: "liberacion",
    label: "Liberar unidad",
    icon: "✓",
    group: "Inventario",
  },
  {
    vista: "baja",
    label: "Dar de baja unidad",
    icon: "⊘",
    group: "Inventario",
  },
];

const GROUPS = ["Inicio", "Donación y calificación", "Pacientes y transfusión", "Inventario"];

type DonanteParaDonacion = Pick<
  Donante,
  "id" | "nombre" | "apellido" | "dni" | "sexoBiologico"
>;

function leerColapsado(): boolean {
  try {
    return window.localStorage.getItem("florhema.sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

export default function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [donanteParaDonacion, setDonanteParaDonacion] =
    useState<DonanteParaDonacion | null>(null);
  const [dniHistoria, setDniHistoria] = useState("");
  const [donacionParaEstudios, setDonacionParaEstudios] = useState<number | null>(
    null,
  );
  const [estudiosDesdeDonacion, setEstudiosDesdeDonacion] = useState(false);
  const [colapsado, setColapsado] = useState(leerColapsado);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "florhema.sidebar-collapsed",
        String(colapsado),
      );
    } catch {
      /* almacenamiento no disponible */
    }
  }, [colapsado]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuAbierto(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navegar(nuevaVista: Vista) {
    if (nuevaVista === "donacion") {
      setDonanteParaDonacion(null);
    }
    if (nuevaVista === "historiaPersona") {
      setDniHistoria("");
    }
    if (nuevaVista === "estudios") {
      setDonacionParaEstudios(null);
      setEstudiosDesdeDonacion(false);
    }
    setVista(nuevaVista);
    setMenuAbierto(false);
  }

  function irAHistoria(dni: string) {
    setDniHistoria(dni);
    setVista("historiaPersona");
    setMenuAbierto(false);
  }

  function irARegistrarDonacion(donante: Donante) {
    setDonanteParaDonacion(donante);
    setVista("donacion");
    setMenuAbierto(false);
  }

  function irACargarEstudios(donacionId: number, desdeDonacion = false) {
    setDonacionParaEstudios(donacionId);
    setEstudiosDesdeDonacion(desdeDonacion);
    setVista("estudios");
    setMenuAbierto(false);
  }

  function volverDeEstudios() {
    if (estudiosDesdeDonacion) {
      setVista("donacion");
      return;
    }
    setDonacionParaEstudios(null);
  }

  const activo = NAV_ITEMS.find((item) => item.vista === vista);
  const grupoActual = activo?.group ?? "Inicio";
  const tituloActual =
    vista === "estudios" && donacionParaEstudios !== null
      ? "Cargar estudios de calificación"
      : (activo?.label ?? "Resumen");

  return (
    <div
      className={`app-shell${colapsado ? " is-collapsed" : ""}${menuAbierto ? " sidebar-open" : ""}`}
    >
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      <aside className="sidebar" aria-label="Navegación principal">
        <div className="sidebar-brand">
          <div className="app-logo" aria-hidden="true">
            <span>F</span>
            <span className="app-logo-dot">+</span>
          </div>
          <div className="app-brand-text">
            <h1>FLORHEMA</h1>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Módulos del sistema">
          {GROUPS.map((group) => (
            <div className="sidebar-group" key={group}>
              <p className="sidebar-group-title">{group}</p>
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
                <button
                  key={item.vista}
                  type="button"
                  className={vista === item.vista ? "activo" : ""}
                  aria-current={vista === item.vista ? "page" : undefined}
                  title={item.label}
                  onClick={() => navegar(item.vista)}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="collapse-button"
            onClick={() => setColapsado((prev) => !prev)}
            aria-label={colapsado ? "Expandir menú lateral" : "Colapsar menú lateral"}
          >
            <span className="nav-icon" aria-hidden="true">
              {colapsado ? "»" : "«"}
            </span>
            <span className="collapse-label">Colapsar menú</span>
          </button>
        </div>
      </aside>

      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Cerrar menú lateral"
        onClick={() => setMenuAbierto(false)}
      />

      <div className="app-body">
        <header className="app-topbar">
          <button
            type="button"
            className="menu-button"
            aria-label="Abrir menú lateral"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((prev) => !prev)}
          >
            ☰
          </button>
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <span>Inicio</span>
            <span className="breadcrumb-sep" aria-hidden="true">
              /
            </span>
            <span>{grupoActual}</span>
            <span className="breadcrumb-sep" aria-hidden="true">
              /
            </span>
            <strong aria-current="page">{tituloActual}</strong>
          </nav>
        </header>

        <main className="app-main" id="contenido-principal" tabIndex={-1}>
          <Suspense fallback={<LoadingState label="Cargando módulo…" />}>
          {vista === "dashboard" && <Dashboard onNavigate={navegar} />}
          {vista === "buscar" && (
            <BuscarDonante onRegistrarDonacion={irARegistrarDonacion} />
          )}
          {vista === "alta" && <AltaDonante />}
          {vista === "paciente" && <AltaPaciente />}
          {vista === "buscarPaciente" && (
            <BuscarPaciente onVerHistorial={irAHistoria} />
          )}
          {vista === "historiaPersona" && (
            <HistoriaPersona
              key={dniHistoria || "sin-dni"}
              dniInicial={dniHistoria}
              onVolver={() => navegar("buscarPaciente")}
            />
          )}
          {vista === "donacion" && (
            <RegistrarDonacion
              key={donanteParaDonacion?.id ?? "sin-donante"}
              donanteInicial={donanteParaDonacion}
              onCargarEstudios={(id) => irACargarEstudios(id, true)}
            />
          )}
          {vista === "estudios" && donacionParaEstudios === null && (
            <SeleccionarDonacionEstudios
              onSeleccionar={(id) => irACargarEstudios(id)}
              onVolver={() => navegar("dashboard")}
            />
          )}
          {vista === "estudios" && donacionParaEstudios !== null && (
            <CargarEstudios
              key={donacionParaEstudios}
              donacionId={donacionParaEstudios}
              onVolver={volverDeEstudios}
            />
          )}
          {vista === "calificacion" && <CalificacionBiologica />}
          {vista === "tipificacion" && <TipificacionSanguinea />}
          {vista === "tamizaje" && <TamizajeInfecciones />}
          {vista === "seleccionar" && <SeleccionarComponente />}
          {vista === "emision" && <EmitirSangre />}
          {vista === "liberacion" && <LiberacionUnidad />}
          {vista === "recepcion" && <RecepcionUnidad />}
          {vista === "baja" && <DarDeBajaUnidad />}
          {vista === "solicitudesTransfusion" && (
            <GestionSolicitudesTransfusion />
          )}
          {vista === "estudiosPretransfusionales" && (
            <EstudiosPretransfusionales />
          )}
          {vista === "consultaResultados" && <ConsultaResultados />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
