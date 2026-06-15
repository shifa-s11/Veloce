import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { signupSchema, loginSchema } from "@task-manager/shared";
import { AuthService } from "./auth.service.js";
import { env } from "../../config/env.js";

export async function authRoutes(app: FastifyInstance) {
  const setAuthCookies = (reply: FastifyReply, accessToken: string, refreshToken: string) => {
    const isProduction = env.NODE_ENV === "production";

    reply.setCookie("accessToken", accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60, // 15 mins in seconds
    });

    reply.setCookie("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  };

  const clearAuthCookies = (reply: FastifyReply) => {
    const isProduction = env.NODE_ENV === "production";

    reply.clearCookie("accessToken", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    reply.clearCookie("refreshToken", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
  };

  app.post("/signup", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signupSchema.parse(request.body);
    const user = await AuthService.signup(body);

    return reply.status(201).send({
      success: true,
      data: { user },
      error: null,
    });
  });

  app.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);
    const { user, accessToken, refreshToken } = await AuthService.login(body);

    // Set HttpOnly cookies (works in same-domain / local dev scenarios)
    setAuthCookies(reply, accessToken, refreshToken);

    // Also return tokens in body for cross-domain Bearer token auth (Vercel → Render)
    return reply.status(200).send({
      success: true,
      data: { user, accessToken, refreshToken },
      error: null,
    });
  });

  app.post("/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    // Accept refreshToken from request body (cross-domain Bearer auth) or cookie (same-domain / local)
    const bodyToken = (request.body as any)?.refreshToken;
    const token = bodyToken || request.cookies.refreshToken;

    if (!token) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Refresh token is missing",
          details: null,
        },
      });
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(token);

    // Set cookies for same-domain environments
    setAuthCookies(reply, accessToken, newRefreshToken);

    // Return tokens in body for cross-domain Bearer token clients
    return reply.status(200).send({
      success: true,
      data: { user, accessToken, refreshToken: newRefreshToken },
      error: null,
    });
  });

  app.post("/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.refreshToken;

    if (token) {
      await AuthService.logout(token);
    }

    clearAuthCookies(reply);

    return reply.status(200).send({
      success: true,
      data: null,
      error: null,
    });
  });
}
