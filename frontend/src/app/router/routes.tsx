import { Route, Routes } from "react-router";
import { AccesoDenegadoPage } from "@/app/pages/AccesoDenegadoPage";
import { NoEncontradoPage } from "@/app/pages/NoEncontradoPage";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { AppLayout } from "@/app/layouts/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { BusquedaPage } from "@/features/dashboard/pages/BusquedaPage";
import { PersonasPage } from "@/features/personas/pages/PersonasPage";
import { PostaFijaPage } from "@/features/donaciones/pages/PostaFijaPage";
import { EstudiosPage } from "@/features/donaciones/pages/EstudiosPage";
import { UnidadTransfusionalPage } from "@/features/transfusiones/pages/UnidadTransfusionalPage";
import { GestantesPage } from "@/features/gestantes/pages/GestantesPage";
import { MaternidadPage } from "@/features/gestantes/pages/MaternidadPage";
import { SangriasPage } from "@/features/sangrias/pages/SangriasPage";
import { ReportesPage } from "@/features/reportes/pages/ReportesPage";
import { UsuariosPage } from "@/features/usuarios/pages/UsuariosPage";
import { CatalogosPage } from "@/features/catalogos/pages/CatalogosPage";
import { AuditoriaPage } from "@/features/auditoria/pages/AuditoriaPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { rutas } from "./paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={rutas.login} element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={rutas.inicio} element={<BusquedaPage />} />
          <Route path={rutas.personas} element={<PersonasPage />} />
          <Route path={rutas.postaFija} element={<PostaFijaPage />} />
          <Route path={rutas.donacionesEstudios} element={<EstudiosPage />} />
          <Route path={rutas.unidadTransfusional} element={<UnidadTransfusionalPage />} />
          <Route
            path={rutas.gestantes}
            element={<ProtectedRoute roles={["ADMINISTRADOR", "TECNICO_HEMOTERAPIA"]} />}
          >
            <Route index element={<GestantesPage />} />
          </Route>
          <Route
            path={rutas.maternidad}
            element={<ProtectedRoute roles={["ADMINISTRADOR", "CONSULTA_MATERNIDAD"]} />}
          >
            <Route index element={<MaternidadPage />} />
          </Route>
          <Route
            path={rutas.sangrias}
            element={<ProtectedRoute roles={["ADMINISTRADOR", "TECNICO_HEMOTERAPIA"]} />}
          >
            <Route index element={<SangriasPage />} />
          </Route>
          <Route path={rutas.reportes} element={<ReportesPage />} />
          <Route path={rutas.usuarios} element={<ProtectedRoute roles={["ADMINISTRADOR"]} />}>
            <Route index element={<UsuariosPage />} />
          </Route>
          <Route path={rutas.catalogos} element={<ProtectedRoute roles={["ADMINISTRADOR"]} />}>
            <Route index element={<CatalogosPage />} />
          </Route>
          <Route path={rutas.auditoria} element={<ProtectedRoute roles={["ADMINISTRADOR"]} />}>
            <Route index element={<AuditoriaPage />} />
          </Route>
          <Route path={rutas.sinAcceso} element={<AccesoDenegadoPage />} />
          <Route path="*" element={<NoEncontradoPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
