"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, CreateTaskInput } from "@task-manager/shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface TaskFormProps {
  initialData?: any;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  submitText: string;
}

export function TaskForm({ initialData, onSubmit, submitText }: TaskFormProps) {
  const [loading, setLoading] = useState(false);

  const defaultValues = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "TODO",
    priority: initialData?.priority || "MEDIUM",
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().substring(0, 16)
      : "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: defaultValues as any,
  });

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      const formattedData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      await onSubmit(formattedData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="title">Title</label>
        <Input id="title" placeholder="Task title" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Detailed task description..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <select
            id="status"
            className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("status")}
          >
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="priority">Priority</label>
          <select
            id="priority"
            className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("priority")}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="dueDate">Due Date</label>
        <Input id="dueDate" type="datetime-local" {...register("dueDate")} />
        {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : submitText}
      </Button>
    </form>
  );
}
