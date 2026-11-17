import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { UNAUTHORIZED_EVENT } from "@/infrastructure/api/errors";
import { tokenStorage } from "@/infrastructure/storage/token.storage";
import { esRol, type Rol } from "@/shared/constants/roles";
import { authApi } from "../api/auth.api";
import type { Credenciales, UsuarioPublico } from "../types";

interface AuthContextValue {
  usuario: UsuarioPublico | null;
  cargando: boolean;
  autenticado: boolean;
  iniciarSesion: (credenciales: Credenciales) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  tieneRol: (...roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const token = tokenStorage.get();
    if (!token) {
      setCargando(false);
      return;
    }

    authApi
      .me()
      .then((perfil) => {
        if (activo) setUsuario(perfil);
      })
      .catch(() => {
        tokenStorage.clear();
        if (activo) setUsuario(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const cerrar = () => setUsuario(null);
    window.addEventListener(UNAUTHORIZED_EVENT, cerrar);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, cerrar);
  }, []);

  const iniciarSesion = useCallback(async (credenciales: Credenciales) => {
    const sesion = await authApi.login(credenciales);
    tokenStorage.set(sesion.token);
    setUsuario(sesion.usuario);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await authApi.logout();
    setUsuario(null);
  }, []);

  const tieneRol = useCallback(
    (...roles: Rol[]) => {
      if (!usuario || !esRol(usuario.rol)) return false;
      return roles.includes(usuario.rol);
    },
    [usuario],
  );

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuario,
      cargando,
      autenticado: usuario !== null,
      iniciarSesion,
      cerrarSesion,
      tieneRol,
    }),
    [usuario, cargando, iniciarSesion, cerrarSesion, tieneRol],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = use(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return contexto;
}
