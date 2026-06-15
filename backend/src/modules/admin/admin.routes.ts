import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { prisma } from "../../lib/prisma.js";
import { promoteSchema } from "@task-manager/shared";
import { env } from "../../config/env.js";

export async function adminRoutes(app: FastifyInstance) {
  // Promotion endpoint - verified by admin secret
  app.post("/promote", async (request: FastifyRequest, reply: FastifyReply) => {
    const secret = request.headers["x-admin-secret"];

    if (!secret || secret !== env.ADMIN_SECRET) {
      return reply.status(403).send({
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "Invalid admin secret",
          details: null,
        },
      });
    }

    const body = promoteSchema.parse(request.body);

    const user = await prisma.user.update({
      where: { email: body.email },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return reply.status(200).send({
      success: true,
      data: user,
      error: null,
    });
  });

  // Protect all routes below with authentication & admin role checks
  await app.register(async (adminProtected) => {
    adminProtected.addHook("preHandler", authenticate);
    adminProtected.addHook("preHandler", authorize(["ADMIN"]));

    adminProtected.get("/users", async (request: FastifyRequest, reply: FastifyReply) => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });

      return reply.status(200).send({
        success: true,
        data: users,
        error: null,
      });
    });

    adminProtected.get("/tasks", async (request: FastifyRequest, reply: FastifyReply) => {
      const tasks = await prisma.task.findMany({
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.status(200).send({
        success: true,
        data: tasks,
        error: null,
      });
    });
  });
}
