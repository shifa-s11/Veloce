import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/errors.js";
import { uploadFile, LOCAL_UPLOADS_DIR } from "../../lib/storage.js";
import path from "path";
import fs from "fs";

export async function attachmentsRoutes(app: FastifyInstance) {
  // Protect all routes
  app.addHook("preHandler", authenticate);

  app.post("/tasks/:id/attachments", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: taskId } = request.params as { id: string };
    const userId = request.user!.sub;
    const userRole = request.user!.role;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new HttpError(404, "NOT_FOUND", "Task not found");
    }

    if (userRole !== "ADMIN" && task.userId !== userId) {
      throw new HttpError(403, "FORBIDDEN", "You do not have access to this task");
    }

    const fileData = await request.file();
    if (!fileData) {
      throw new HttpError(400, "BAD_REQUEST", "No file uploaded");
    }

    const fileBuffer = await fileData.toBuffer();
    if (fileBuffer.byteLength > 10 * 1024 * 1024) {
      throw new HttpError(422, "VALIDATION_ERROR", "File size exceeds 10MB limit");
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(fileData.mimetype)) {
      throw new HttpError(422, "VALIDATION_ERROR", "File type not allowed. Only images and PDFs are supported.");
    }

    const fileUrl = await uploadFile(
      task.userId,
      taskId,
      fileData.filename,
      fileBuffer,
      fileData.mimetype
    );

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileName: fileData.filename,
        fileUrl,
        fileSize: fileBuffer.byteLength,
        mimeType: fileData.mimetype,
      },
    });

    await prisma.activityLog.create({
      data: {
        taskId,
        userId,
        action: "ATTACHMENT_ADD",
        newValue: { fileName: attachment.fileName } as any,
      },
    });

    return reply.status(201).send({
      success: true,
      data: attachment,
      error: null,
    });
  });

  app.delete("/tasks/:id/attachments/:attachmentId", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: taskId, attachmentId } = request.params as { id: string; attachmentId: string };
    const userId = request.user!.sub;
    const userRole = request.user!.role;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new HttpError(404, "NOT_FOUND", "Task not found");
    }

    if (userRole !== "ADMIN" && task.userId !== userId) {
      throw new HttpError(403, "FORBIDDEN", "You do not have access to this task");
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new HttpError(404, "NOT_FOUND", "Attachment not found");
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    await prisma.activityLog.create({
      data: {
        taskId,
        userId,
        action: "ATTACHMENT_REMOVE",
        oldValue: { fileName: attachment.fileName } as any,
      },
    });

    return reply.status(200).send({
      success: true,
      data: null,
      error: null,
    });
  });

  // Secure serving of local fallback uploads
  app.get("/uploads/:userId/:taskId/:filename", async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId: urlUserId, taskId, filename } = request.params as {
      userId: string;
      taskId: string;
      filename: string;
    };
    const authUserId = request.user!.sub;
    const authUserRole = request.user!.role;

    if (authUserRole !== "ADMIN" && urlUserId !== authUserId) {
      throw new HttpError(403, "FORBIDDEN", "You do not have permission to access this file");
    }

    const filePath = path.join(LOCAL_UPLOADS_DIR, urlUserId, taskId, filename);

    if (!fs.existsSync(filePath)) {
      throw new HttpError(404, "NOT_FOUND", "File not found");
    }

    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
  });
}
