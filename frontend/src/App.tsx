import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import "./App.css";

type Vista = "alta" | "buscar";

export default function App() {
  const [vista, setVista] = useState<Vista>("buscar");

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
      </nav>

      {vista === "buscar" ? <BuscarDonante /> : <AltaDonante />}
    </>
  );
}