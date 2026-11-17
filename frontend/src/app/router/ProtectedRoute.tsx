import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/features/auth/model/AuthContext";
import { LoadingPanel } from "@/shared/components/ui/StatePanel";
import type { Rol } from "@/shared/constants/roles";

interface ProtectedRouteProps {
  roles?: Rol[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { autenticado, cargando, tieneRol } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="auth-layout">
        <LoadingPanel />
      </div>
    );
  }

  if (!autenticado) {
    const destino = `${ubicacion.pathname}${ubicacion.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(destino)}`} replace />;
  }

  if (roles && !tieneRol(...roles)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return <Outlet />;
}
