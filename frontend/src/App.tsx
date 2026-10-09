import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import RegistrarDonacion from "./pages/RegistrarDonacion";
import CargarEstudios from "./pages/CargarEstudios";
import type { Donante } from "./types/donante";
import "./App.css";

type Vista = "alta" | "buscar" | "donacion" | "estudios";

export default function App() {
  const [vista, setVista] = useState<Vista>("buscar");
  const [donanteParaDonacion, setDonanteParaDonacion] =
    useState<Donante | null>(null);
  const [donacionParaEstudios, setDonacionParaEstudios] = useState<
    number | null
  >(null);

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
      </nav>

      {vista === "buscar" && (
        <BuscarDonante onRegistrarDonacion={irARegistrarDonacion} />
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
    </>
  );
}
