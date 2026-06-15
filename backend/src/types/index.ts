import { JWTPayload } from "../lib/jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}
