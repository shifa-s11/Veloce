import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error);

  // Zod validation errors
  if (error.name === "ZodError" || error instanceof ZodError) {
    const zodError = error as unknown as ZodError;
    return reply.status(422).send({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Input validation failed",
        details: zodError.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
    });
  }

  // Prisma database errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    // Unique constraint violation (e.g. email already exists)
    if (prismaError.code === "P2002") {
      const target = (prismaError.meta?.target as string[])?.join(", ") || "field";
      return reply.status(409).send({
        success: false,
        data: null,
        error: {
          code: "CONFLICT",
          message: `A record with this ${target} already exists.`,
          details: null,
        },
      });
    }

    // Record not found
    if (prismaError.code === "P2025") {
      return reply.status(404).send({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Record not found",
          details: null,
        },
      });
    }
  }

  // Fastify custom validation / other errors
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : error.message;
  const code = error.code || "INTERNAL_SERVER_ERROR";

  return reply.status(statusCode).send({
    success: false,
    data: null,
    error: {
      code,
      message,
      details: null,
    },
  });
};
