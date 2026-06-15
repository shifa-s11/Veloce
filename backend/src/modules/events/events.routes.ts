import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../../lib/jwt.js";
import { sseManager } from "../../lib/sse.js";

export async function eventsRoutes(app: FastifyInstance) {
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    let token = request.cookies.accessToken;

    if (!token) {
      const query = request.query as { token?: string };
      token = query.token;
    }

    if (!token) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token is missing",
          details: null,
        },
      });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
          details: null,
        },
      });
    }

    const userId = decoded.sub;

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": request.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true",
    });

    reply.raw.write("retry: 10000\n\n");
    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    sseManager.addConnection(userId, reply);
  });
}
