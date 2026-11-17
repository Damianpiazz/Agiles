import cors from "cors";
import express from "express";
import { env, isProduction } from "./config/env";
import { auditMutations } from "./middlewares/audit-mutations";
import { authenticate } from "./middlewares/auth";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { requestLogger } from "./middlewares/request-logger";
import apiRouter from "./routes";

/**
 * Crea la aplicación Express con todos los middlewares globales y la API v1.
 * Se exporta separado del arranque para poder testearla sin abrir un puerto.
 */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.frontendUrl === "*" ? true : env.frontendUrl.split(",").map((url) => url.trim()),
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: false }));

  if (env.requestLogging) app.use(requestLogger);
  app.use(auditMutations);
  app.use(authenticate);

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      app: "Florhema API",
      version: "v1",
      documentacion: "/api/v1",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, entorno: env.nodeEnv, timestamp: new Date().toISOString() });
  });

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (isProduction && env.authSecret === "florhema-dev-secret") {
    console.warn("AUTH_SECRET no está configurado en producción. Cambiá el secreto por defecto.");
  }

  return app;
}

export default createApp;
