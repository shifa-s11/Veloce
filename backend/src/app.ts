import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Register Cookie Plugin
  await app.register(cookie);

  // Register CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow local development and credential-sharing
      cb(null, true);
    },
    credentials: true,
  });

  // Register Rate Limiting on Auth
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Healthcheck Route
  app.get("/health", async () => {
    return { status: "OK", timestamp: new Date().toISOString() };
  });

  // Register API Routes
  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: "/auth" });
    },
    { prefix: "/api/v1" }
  );

  return app;
}
