import { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../lib/jwt.js";

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  let token = request.cookies.accessToken;

  if (!token) {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
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
        message: "Invalid or expired authentication token",
        details: null,
      },
    });
  }

  request.user = decoded;
};
