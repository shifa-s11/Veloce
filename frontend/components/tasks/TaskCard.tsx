"use client";

import { useState } from "react";
import { formatDistanceToNow, isPast } from "date-fns";
import { Calendar, Paperclip, Eye, Trash2, Edit } from "lucide-react";
import { Button } from "../ui/button.js";
import Link from "next/link";
import { toast } from "sonner";
import { Modal } from "../shared/Modal.js";
import { TaskForm } from "./TaskForm.js";

interface TaskCardProps {
  task: any;
  onUpdate: (id: string, data: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = task.status === "DONE";
  const hasDueDate = !!task.dueDate;
  const isOverdue = hasDueDate && !isCompleted && isPast(new Date(task.dueDate));

  const priorityStyles = {
    LOW: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    HIGH: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    URGENT: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  };

  const priorityColors = {
    LOW: "border-l-emerald-500",
    MEDIUM: "border-l-amber-500",
    HIGH: "border-l-orange-500",
    URGENT: "border-l-rose-500",
  };

  const handleToggleComplete = async () => {
    try {
      await onUpdate(task.id, {
        status: isCompleted ? "TODO" : "DONE",
      });
      toast.success(isCompleted ? "Task marked as active" : "Task completed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    }
  };

  const handleEdit = async (data: any) => {
    try {
      await onUpdate(task.id, data);
      toast.success("Task updated successfully!");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      toast.success("Task deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-l-4 ${
          priorityColors[task.priority as keyof typeof priorityColors] || "border-l-primary"
        } ${isCompleted ? "opacity-75" : ""}`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between space-x-2">
            <div className="flex items-start space-x-3 min-w-0">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleToggleComplete}
                className="mt-1 h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary/30 cursor-pointer"
              />
              <div className="min-w-0">
                <h4
                  className={`font-semibold text-base leading-snug tracking-tight text-foreground break-words ${
                    isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </h4>
              </div>
            </div>

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                priorityStyles[task.priority as keyof typeof priorityStyles]
              }`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p
              className={`text-sm text-muted-foreground line-clamp-2 break-words ${
                isCompleted ? "line-through opacity-50" : ""
              }`}
            >
              {task.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            {hasDueDate && (
              <div
                className={`flex items-center space-x-1 ${
                  isOverdue ? "text-rose-500 font-medium" : ""
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {isCompleted
                    ? "Completed"
                    : isOverdue
                    ? `Overdue (${formatDistanceToNow(new Date(task.dueDate))} ago)`
                    : `Due in ${formatDistanceToNow(new Date(task.dueDate))}`}
                </span>
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{task.attachments.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Link href={`/tasks/${task.id}`} passHref>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Task">
        <TaskForm
          initialData={task}
          onSubmit={handleEdit}
          submitText="Save Changes"
        />
      </Modal>
    </>
  );
}
