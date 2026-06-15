"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Paperclip, History, ArrowLeft, Loader2, Plus, FileText, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [uploading, setUploading] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/tasks/${taskId}`,
    () => api.get(`/tasks/${taskId}`).then((res) => res.data)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await api.upload(`/tasks/${taskId}/attachments`, formData);
      toast.success("Attachment uploaded successfully!");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return;
    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      toast.success("Attachment removed successfully");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete attachment");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <p className="font-medium">Failed to load task details</p>
        <Button onClick={() => router.push("/tasks")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tasks")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Task details
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Properties</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Status</span>
                <span className="font-semibold text-foreground mt-1 block capitalize">
                  {data.status.replace("_", " ").toLowerCase()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Priority</span>
                <span className="font-semibold text-foreground mt-1 block capitalize">
                  {data.priority.toLowerCase()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" /> Due Date
                </span>
                <span className="font-semibold text-foreground mt-1 block">
                  {data.dueDate ? format(new Date(data.dueDate), "PPP p") : "No due date"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Created At</span>
                <span className="font-semibold text-foreground mt-1 block">
                  {format(new Date(data.createdAt), "PPP p")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
            <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">
              {data.description || "No description provided."}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center">
                <Paperclip className="h-4 w-4 mr-2" /> Attachments
              </h3>
              <div className="relative">
                <Input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploading}
                  className="cursor-pointer"
                >
                  <label htmlFor="file-upload">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </label>
                </Button>
              </div>
            </div>

            {data.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                No attachments uploaded yet. Supporting images and PDFs up to 10MB.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.attachments.map((file: any) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm"
                  >
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 min-w-0 hover:underline hover:text-primary"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{file.fileName}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDeleteAttachment(file.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center border-b border-border pb-3">
            <History className="h-4 w-4 mr-2" /> Activity Log
          </h3>

          <div className="relative border-l border-border pl-4 space-y-6">
            {data.activityLogs.map((log: any) => (
              <div key={log.id} className="relative text-xs">
                <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <div className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{log.user.fullName}</span>{" "}
                  {log.action === "CREATE" ? (
                    <span>created the task</span>
                  ) : log.action === "UPDATE" ? (
                    <span>updated the task</span>
                  ) : log.action === "ATTACHMENT_ADD" ? (
                    <span>added attachment <strong className="text-foreground">{log.newValue?.fileName}</strong></span>
                  ) : log.action === "ATTACHMENT_REMOVE" ? (
                    <span>removed attachment <strong className="text-foreground">{log.oldValue?.fileName}</strong></span>
                  ) : (
                    <span>modified the task</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(log.createdAt))} ago
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
