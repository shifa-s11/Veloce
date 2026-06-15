import useSWR from "swr";
import { api } from "../lib/api.js";
import { CreateTaskInput, UpdateTaskInput } from "@task-manager/shared";

interface GetTasksParams {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function useTasks(params: GetTasksParams = {}) {
  const queryParts: string[] = [];
  if (params.status) queryParts.push(`status=${params.status}`);
  if (params.priority) queryParts.push(`priority=${params.priority}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
  if (params.order) queryParts.push(`order=${params.order}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const key = `/tasks${queryString}`;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => api.get(key).then((res) => res)
  );

  const createTask = async (input: CreateTaskInput) => {
    const res = await api.post("/tasks", input);
    mutate();
    return res.data;
  };

  const updateTask = async (taskId: string, input: UpdateTaskInput) => {
    const oldData = data;
    if (data && data.success) {
      const updatedList = data.data.map((task: any) =>
        task.id === taskId ? { ...task, ...input } : task
      );
      mutate({ ...data, data: updatedList }, false);
    }

    try {
      const res = await api.patch(`/tasks/${taskId}`, input);
      mutate();
      return res.data;
    } catch (err) {
      mutate(oldData, false);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    const oldData = data;
    if (data && data.success) {
      const updatedList = data.data.filter((task: any) => task.id !== taskId);
      mutate({ ...data, data: updatedList }, false);
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      mutate();
    } catch (err) {
      mutate(oldData, false);
      throw err;
    }
  };

  return {
    tasks: data?.data || [],
    meta: data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    error,
    isLoading,
    mutate,
    createTask,
    updateTask,
    deleteTask,
  };
}
