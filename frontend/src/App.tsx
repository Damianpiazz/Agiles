import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import RegistrarDonacion from "./pages/RegistrarDonacion";
import CargarEstudios from "./pages/CargarEstudios";
import Entrevista from "./pages/Entrevista";
import type { Donante } from "./types/donante";
import "./App.css";

type Vista = "alta" | "buscar" | "donacion" | "estudios" | "entrevista";
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
    <>
      <nav className="app-nav">
        <button
          type="button"
          className={vista === "buscar" ? "activo" : ""}
          onClick={() => setVista("buscar")}
        >
          Buscar donante
        </button>

        <button
          type="button"
          className={vista === "alta" ? "activo" : ""}
          onClick={() => setVista("alta")}
        >
          Alta de donante
        </button>

        <button
          type="button"
          className={vista === "donacion" ? "activo" : ""}
          onClick={abrirDonacion}
        >
          Registrar donación
        </button>

        <button
          type="button"
          className={vista === "entrevista" ? "activo" : ""}
          onClick={() => irAEntrevista()}
        >
          Entrevista pre-donación
        </button>
      </nav>

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
        <Entrevista
          key={donanteEntrevista?.id ?? "sin-donante"}
          donanteInicial={donanteEntrevista}
        />
      )}
    </>
  );
}
