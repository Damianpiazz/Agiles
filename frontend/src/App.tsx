import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import RegistrarDonacion from "./pages/RegistrarDonacion";
import type { Donante } from "./types/donante";
import "./App.css";

type Vista = "alta" | "buscar" | "donacion";

export default function App() {
  const [vista, setVista] = useState<Vista>("buscar");
  const [donanteParaDonacion, setDonanteParaDonacion] =
    useState<Donante | null>(null);

  function irARegistrarDonacion(donante: Donante) {
    setDonanteParaDonacion(donante);
    setVista("donacion");
  }

  function abrirDonacion() {
    setDonanteParaDonacion(null);
    setVista("donacion");
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
        <RegistrarDonacion donanteInicial={donanteParaDonacion} />
      )}
    </>
  );
}
