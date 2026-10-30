
import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import RegistrarDonacion from "./pages/RegistrarDonacion";
import CargarEstudios from "./pages/CargarEstudios";
import Entrevista from "./pages/Entrevista";
import CalificacionBiologica from "./pages/CalificacionBiologica";
import TipificacionSanguinea from "./pages/TipificacionSanguinea";
import TamizajeInfecciones from "./pages/TamizajeInfecciones";
import LiberacionUnidad from "./pages/LiberacionUnidad";
import type { Donante } from "./types/donante";
import "./App.css";

type Vista =
  | "alta"
  | "buscar"
  | "donacion"
  | "estudios"
  | "entrevista"
  | "calificacion"
  | "tipificacion"
  | "tamizaje"
  | "liberacion";

type DonanteEntrevista = Pick<
  Donante,
  "id" | "nombre" | "apellido" | "dni" | "sexoBiologico"
>;

export default function App() {
  const [vista, setVista] = useState<Vista>("buscar");
  const [donanteParaDonacion, setDonanteParaDonacion] =
    useState<DonanteEntrevista | null>(null);
  const [donacionParaEstudios, setDonacionParaEstudios] = useState<
    number | null
  >(null);
  const [donanteEntrevista, setDonanteEntrevista] =
    useState<DonanteEntrevista | null>(null);
  function irARegistrarDonacion(donante: Donante) {
    setDonanteParaDonacion(donante);
    setDonanteEntrevista(donante);
    setVista("entrevista");
  }

  function abrirDonacion() {
    setDonanteParaDonacion(null);
    setDonanteEntrevista(null);
    setVista("entrevista");
  }

  function irACargarEstudios(donacionId: number) {
    setDonacionParaEstudios(donacionId);
    setVista("estudios");
  }

  function continuarDonacionAdmitida(donante: DonanteEntrevista) {
    setDonanteParaDonacion(donante);
    setVista("donacion");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo" aria-hidden="true">
            <span>F</span>
            <span className="app-logo-dot">+</span>
          </div>

          <div className="app-brand-text">
            <h1>FLORHEMA</h1>
            <p>Sistema de Gestión de Hemoterapia</p>
          </div>
        </div>

        <div className="app-header-info">
          <span className="app-status-dot" />
          <span>Servicio de Hemoterapia</span>
        </div>
      </header>

      <nav className="app-nav" aria-label="Navegación principal">
        <button
          type="button"
          className={vista === "buscar" ? "activo" : ""}
          aria-current={vista === "buscar" ? "page" : undefined}
          onClick={() => setVista("buscar")}
        >
          <span className="nav-icon" aria-hidden="true">⌕</span>
          Buscar donante
        </button>

        <button
          type="button"
          className={vista === "alta" ? "activo" : ""}
          aria-current={vista === "alta" ? "page" : undefined}
          onClick={() => setVista("alta")}
        >
          <span className="nav-icon" aria-hidden="true">＋</span>
          Alta de donante
        </button>

        <button
          type="button"
          className={vista === "donacion" ? "activo" : ""}
          aria-current={vista === "donacion" ? "page" : undefined}
          onClick={abrirDonacion}
        >
          <span className="nav-icon" aria-hidden="true">♥</span>
          Registrar donación
        </button>

        <button
          type="button"
          className={vista === "calificacion" ? "activo" : ""}
          aria-current={vista === "calificacion" ? "page" : undefined}
          onClick={() => setVista("calificacion")}
        >
          <span className="nav-icon" aria-hidden="true">✓</span>
          Calificación biológica
        </button>

        <button
          type="button"
          className={vista === "tipificacion" ? "activo" : ""}
          aria-current={vista === "tipificacion" ? "page" : undefined}
          onClick={() => setVista("tipificacion")}
        >
          <span className="nav-icon" aria-hidden="true">⊕</span>
          Tipificación sanguínea
        </button>

        <button
          type="button"
          className={vista === "tamizaje" ? "activo" : ""}
          aria-current={vista === "tamizaje" ? "page" : undefined}
          onClick={() => setVista("tamizaje")}
        >
          <span className="nav-icon" aria-hidden="true">◉</span>
          Tamizaje de infecciones
        </button>

        <button
          type="button"
          className={vista === "liberacion" ? "activo" : ""}
          aria-current={vista === "liberacion" ? "page" : undefined}
          onClick={() => setVista("liberacion")}
        >
          <span className="nav-icon" aria-hidden="true">
            ✓
          </span>
          Liberar unidad
        </button>
      </nav>

      <main className="app-main">
        {vista === "buscar" && (
          <BuscarDonante
            onRegistrarDonacion={irARegistrarDonacion}
          />
        )}

        {vista === "alta" && <AltaDonante />}

        {vista === "donacion" && donanteParaDonacion && (
          <RegistrarDonacion
            donanteInicial={donanteParaDonacion}
            onCargarEstudios={irACargarEstudios}
          />
        )}

        {vista === "estudios" && donacionParaEstudios !== null && (
          <CargarEstudios
            donacionId={donacionParaEstudios}
            onVolver={() => setVista("donacion")}
          />
        )}

        {vista === "entrevista" && (
          <Entrevista
            key={donanteEntrevista?.id ?? "sin-donante"}
            donanteInicial={donanteEntrevista}
            onEntrevistaAdmitida={continuarDonacionAdmitida}
          />
        )}

        {vista === "calificacion" && <CalificacionBiologica />}
        {vista === "tipificacion" && <TipificacionSanguinea />}
        {vista === "tamizaje" && <TamizajeInfecciones />}
        {vista === "liberacion" && <LiberacionUnidad />}
      </main>

      <footer className="app-footer">
        <span>FLORHEMA</span>
        <span>Gestión de Hemoterapia</span>
      </footer>
    </div>
  );
}
