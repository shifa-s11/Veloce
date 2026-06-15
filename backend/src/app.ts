import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { attachmentsRoutes } from "./modules/attachments/attachments.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Register Cookie Plugin
  await app.register(cookie);

  // Register Multipart Plugin for file uploads
  await app.register(multipart);

  // Register CORS
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",");
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow local development, credential sharing, and specified origins
      if (!origin || env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Not allowed by CORS"), false);
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
      await api.register(tasksRoutes, { prefix: "/tasks" });
      await api.register(attachmentsRoutes);
      await api.register(eventsRoutes, { prefix: "/events" });
      await api.register(adminRoutes, { prefix: "/admin" });
    },
    { prefix: "/api/v1" }
  );

  return app;
}
