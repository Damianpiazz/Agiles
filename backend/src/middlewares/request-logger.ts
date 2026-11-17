import type { RequestHandler } from "express";
import { env } from "../config/env";

export const requestLogger: RequestHandler = (req, res, next) => {
  if (!env.requestLogging) return next();
  const startedAt = Date.now();
  res.on("finish", () => {
    const elapsed = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${elapsed} ms)`);
  });
  next();
};
