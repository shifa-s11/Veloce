import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  status: taskStatusSchema.optional().default("TODO"),
  priority: taskPrioritySchema.optional().default("MEDIUM"),
  dueDate: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return null;
    return val;
  }, z.union([
    z.string().datetime({ message: "Invalid date string, must be ISO-8601 format" }),
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
  ]).optional().nullable()),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title cannot exceed 100 characters").optional(),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return null;
    return val;
  }, z.union([
    z.string().datetime({ message: "Invalid date string, must be ISO-8601 format" }),
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
  ]).optional().nullable()),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
