import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { createTaskSchema, updateTaskSchema } from "@task-manager/shared";
import { TasksService } from "./tasks.service.js";

export async function tasksRoutes(app: FastifyInstance) {
  // Protect all task routes
  app.addHook("preHandler", authenticate);

  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createTaskSchema.parse(request.body);
    const userId = request.user!.sub;

    const task = await TasksService.createTask(userId, body);

    return reply.status(201).send({
      success: true,
      data: task,
      error: null,
    });
  });

  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;

    const filters = {
      status: query.status,
      priority: query.priority,
      search: query.search,
      sortBy: query.sortBy,
      order: query.order,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    };

    const userId = request.user!.sub;
    const userRole = request.user!.role;

    const result = await TasksService.getTasks(userId, userRole, filters);

    return reply.status(200).send({
      success: true,
      data: result.tasks,
      meta: result.meta,
      error: null,
    });
  });

  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.sub;
    const userRole = request.user!.role;

    const task = await TasksService.getTaskById(id, userId, userRole);

    return reply.status(200).send({
      success: true,
      data: task,
      error: null,
    });
  });

  app.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = updateTaskSchema.parse(request.body);
    const userId = request.user!.sub;
    const userRole = request.user!.role;

    const task = await TasksService.updateTask(id, userId, userRole, body);

    return reply.status(200).send({
      success: true,
      data: task,
      error: null,
    });
  });

  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.sub;
    const userRole = request.user!.role;

    await TasksService.deleteTask(id, userId, userRole);

    return reply.status(200).send({
      success: true,
      data: null,
      error: null,
    });
  });

  app.get("/:id/activity", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.sub;
    const userRole = request.user!.role;

    const task = await TasksService.getTaskById(id, userId, userRole);

    return reply.status(200).send({
      success: true,
      data: task.activityLogs,
      error: null,
    });
  });
}
