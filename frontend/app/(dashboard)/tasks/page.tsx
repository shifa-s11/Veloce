"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/shared/Modal";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 6;

  const {
    tasks,
    meta,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks({
    search,
    status,
    priority,
    sortBy,
    order,
    page,
    limit,
  });

  const handleCreateTask = async (data: any) => {
    try {
      await createTask(data);
      toast.success("Task created successfully!");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSortBy("createdAt");
    setOrder("desc");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keep track of your tasks and projects.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="flex flex-col space-y-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:space-x-3 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full md:w-40"
        >
          <option value="">All Statuses</option>
          <option value="TODO">Todo</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>

        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full md:w-40"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={`${sortBy}:${order}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(":");
            setSortBy(field);
            setOrder(dir as "asc" | "desc");
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full md:w-48"
        >
          <option value="createdAt:desc">Created Date (Newest)</option>
          <option value="createdAt:asc">Created Date (Oldest)</option>
          <option value="dueDate:asc">Due Date (Earliest)</option>
          <option value="dueDate:desc">Due Date (Latest)</option>
          <option value="priority:desc">Priority (Highest)</option>
          <option value="priority:asc">Priority (Lowest)</option>
        </select>

        {(search || status || priority || sortBy !== "createdAt" || order !== "desc") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-muted-foreground w-full md:w-auto"
          >
            Reset
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-medium">Failed to load tasks</p>
          <p className="text-sm mt-1">{error.message || "Please try again later."}</p>
        </div>
      )}

      {isLoading && <LoadingSkeleton />}

      {!isLoading && !error && tasks.length === 0 && (
        <EmptyState
          title={search || status || priority ? "No tasks match your filters" : "Your workspace is clean"}
          description={
            search || status || priority
              ? "Try adjusting your search keywords, status filters, or sorting order to find what you're looking for."
              : "Get started by creating your very first task. Break down projects, assign deadlines, and keep track of updates!"
          }
          actionText={search || status || priority ? "Reset Filters" : "Add Your First Task"}
          onAction={search || status || priority ? handleResetFilters : () => setCreateOpen(true)}
        />
      )}

      {!isLoading && !error && tasks.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task: any) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">
                Showing page <strong className="text-foreground">{meta.page}</strong> of{" "}
                <strong className="text-foreground">{meta.totalPages}</strong> ({meta.total} total tasks)
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Task">
        <TaskForm onSubmit={handleCreateTask} submitText="Create Task" />
      </Modal>
    </div>
  );
}
