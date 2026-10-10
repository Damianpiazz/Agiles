import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // El módulo de Prisma se importa al cargar los servicios; con esta URL
    // el cliente se construye sin conectarse a la base.
    env: {
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5432/florhema_db?schema=public",
    },
  },
});
