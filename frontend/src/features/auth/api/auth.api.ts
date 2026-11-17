import { api } from "@/infrastructure/api/client";
import { endpoints } from "@/infrastructure/api/endpoints";
import { tokenStorage } from "@/infrastructure/storage/token.storage";
import type { Credenciales, Sesion, UsuarioPublico } from "../types";

export const authApi = {
  login(credenciales: Credenciales) {
    return api.post<Sesion>(endpoints.auth.login, credenciales, { auth: false });
  },
  me() {
    return api.get<UsuarioPublico>(endpoints.auth.me);
  },
  async logout() {
    try {
      await api.post(endpoints.auth.logout);
    } finally {
      tokenStorage.clear();
    }
  },
};
