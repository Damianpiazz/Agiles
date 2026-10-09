import { useState } from "react";
import AltaDonante from "./pages/AltaDonante";
import BuscarDonante from "./pages/BuscarDonante";
import Entrevista from "./pages/Entrevista";
import "./App.css";

type Vista = "alta" | "buscar" | "entrevista";

type DonanteEntrevista = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  sexoBiologico: "MASCULINO" | "FEMENINO";
};

export default function App() {
  const [vista, setVista] = useState<Vista>("buscar");
  const [donanteEntrevista, setDonanteEntrevista] =
    useState<DonanteEntrevista | null>(null);

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
          className={vista === "entrevista" ? "activo" : ""}
          onClick={() => irAEntrevista()}
        >
          Entrevista pre-donación
        </button>
      </nav>

      {vista === "buscar" && (
        <BuscarDonante onNuevaEntrevista={irAEntrevista} />
      )}
      {vista === "alta" && <AltaDonante />}
      {vista === "entrevista" && (
        <Entrevista
          key={donanteEntrevista?.id ?? "sin-donante"}
          donanteInicial={donanteEntrevista}
        />
      )}
    </>
  );
}