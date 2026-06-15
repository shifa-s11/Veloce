import { FastifyReply, FastifyRequest } from "fastify";

export const authorize = (allowedRoles: ("USER" | "ADMIN")[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
          details: null,
        },
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource",
          details: null,
        },
      });
    }
  };
};
