
import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import RegistrarDonacion from "./pages/RegistrarDonacion";
import CargarEstudios from "./pages/CargarEstudios";
import Entrevista from "./pages/Entrevista";
import CalificacionBiologica from "./pages/CalificacionBiologica";
import TipificacionSanguinea from "./pages/TipificacionSanguinea";
import type { Donante } from "./types/donante";
import "./App.css";

type Vista =
  | "alta"
  | "buscar"
  | "donacion"
  | "estudios"
  | "entrevista"
  | "calificacion"
  | "tipificacion";

type DonanteEntrevista = Pick<
  Donante,
  "id" | "nombre" | "apellido" | "dni" | "sexoBiologico"
>;

export default function App() {
  const [vista, setVista] = useState<Vista>("buscar");
  const [donanteParaDonacion, setDonanteParaDonacion] =
    useState<Donante | null>(null);
  const [donacionParaEstudios, setDonacionParaEstudios] = useState<
    number | null
  >(null);
  const [donanteEntrevista, setDonanteEntrevista] =
    useState<DonanteEntrevista | null>(null);

  function irARegistrarDonacion(donante: Donante) {
    setDonanteParaDonacion(donante);
    setVista("donacion");
  }

  function abrirDonacion() {
    setDonanteParaDonacion(null);
    setVista("donacion");
  }

  function irACargarEstudios(donacionId: number) {
    setDonacionParaEstudios(donacionId);
    setVista("estudios");
  }

  function irAEntrevista(donante?: DonanteEntrevista) {
    setDonanteEntrevista(donante ?? null);
    setVista("entrevista");
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
          className={vista === "entrevista" ? "activo" : ""}
          aria-current={vista === "entrevista" ? "page" : undefined}
          onClick={() => irAEntrevista()}
        >
          <span className="nav-icon" aria-hidden="true">▤</span>
          Entrevista pre-donación
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
      </nav>

      <main className="app-main">
        {vista === "buscar" && (
          <BuscarDonante
            onRegistrarDonacion={irARegistrarDonacion}
            onNuevaEntrevista={irAEntrevista}
          />
        )}

        {vista === "alta" && <AltaDonante />}

        {vista === "donacion" && (
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
          <Entrevista key={donanteEntrevista?.id ?? "sin-donante"} />
        )}

        {vista === "calificacion" && <CalificacionBiologica />}
        {vista === "tipificacion" && <TipificacionSanguinea />}
      </main>

      <footer className="app-footer">
        <span>FLORHEMA</span>
        <span>Gestión de Hemoterapia</span>
      </footer>
    </div>
  );
}
