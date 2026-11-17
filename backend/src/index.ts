import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Florhema API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  console.log(`API v1 disponible en http://localhost:${env.port}/api/v1`);
});

/** Cierra ordenadamente el servidor y la conexión a la base de datos. */
async function apagar(senal: string) {
  console.log(`\n${senal} recibido, cerrando el servidor...`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  });
}

process.on("SIGINT", () => void apagar("SIGINT"));
process.on("SIGTERM", () => void apagar("SIGTERM"));

export { app };
