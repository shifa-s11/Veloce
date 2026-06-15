import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/errors.js";
import { CreateTaskInput, UpdateTaskInput } from "@task-manager/shared";
import { sseManager } from "../../lib/sse.js";

interface GetTasksFilters {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: "dueDate" | "priority" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export class TasksService {
  static async createTask(userId: string, input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        status: input.status as any,
        priority: input.priority as any,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        userId,
        action: "CREATE",
        newValue: task as any,
      },
    });

    sseManager.broadcast(userId, "task:created", task);

    return task;
  }

  static async getTasks(userId: string, userRole: "USER" | "ADMIN", filters: GetTasksFilters) {
    const {
      status,
      priority,
      search,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (userRole !== "ADMIN") {
      where.userId = userId;
    }

    if (status) {
      where.status = { in: status.split(",") };
    }

    if (priority) {
      where.priority = { in: priority.split(",") };
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const total = await prisma.task.count({ where });
    const totalPages = Math.ceil(total / limit);

    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        attachments: true,
      },
    });

    return {
      tasks,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  static async getTaskById(taskId: string, userId: string, userRole: "USER" | "ADMIN") {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        attachments: true,
        activityLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new HttpError(404, "NOT_FOUND", "Task not found");
    }

    if (userRole !== "ADMIN" && task.userId !== userId) {
      throw new HttpError(403, "FORBIDDEN", "You do not have access to this task");
    }

    return task;
  }

  static async updateTask(taskId: string, userId: string, userRole: "USER" | "ADMIN", input: UpdateTaskInput) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new HttpError(404, "NOT_FOUND", "Task not found");
    }

    if (userRole !== "ADMIN" && task.userId !== userId) {
      throw new HttpError(403, "FORBIDDEN", "You do not have access to this task");
    }

    const updatedData: any = {};
    if (input.title !== undefined) updatedData.title = input.title;
    if (input.description !== undefined) updatedData.description = input.description;
    if (input.status !== undefined) updatedData.status = input.status;
    if (input.priority !== undefined) updatedData.priority = input.priority;
    if (input.dueDate !== undefined) updatedData.dueDate = input.dueDate ? new Date(input.dueDate) : null;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updatedData,
    });

    await prisma.activityLog.create({
      data: {
        taskId,
        userId,
        action: "UPDATE",
        oldValue: task as any,
        newValue: updatedTask as any,
      },
    });

    sseManager.broadcast(task.userId, "task:updated", updatedTask);

    if (userRole === "ADMIN" && task.userId !== userId) {
      sseManager.broadcast(userId, "task:updated", updatedTask);
    }

    return updatedTask;
  }

  static async deleteTask(taskId: string, userId: string, userRole: "USER" | "ADMIN") {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new HttpError(404, "NOT_FOUND", "Task not found");
    }

    if (userRole !== "ADMIN" && task.userId !== userId) {
      throw new HttpError(403, "FORBIDDEN", "You do not have access to this task");
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    sseManager.broadcast(task.userId, "task:deleted", { id: taskId });
    if (userRole === "ADMIN" && task.userId !== userId) {
      sseManager.broadcast(userId, "task:deleted", { id: taskId });
    }
  }
}
