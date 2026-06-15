"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, CheckSquare, Users, Shield } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tasks" | "users">("tasks");

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/tasks");
    }
  }, [user, router]);

  const { data: tasksData, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    user?.role === "ADMIN" ? "/admin/tasks" : null,
    () => api.get("/admin/tasks").then((res) => res.data)
  );

  const { data: usersData, isLoading: usersLoading, mutate: mutateUsers } = useSWR(
    user?.role === "ADMIN" ? "/admin/users" : null,
    () => api.get("/admin/users").then((res) => res.data)
  );

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view the administrator dashboard.
        </p>
      </div>
    );
  }

  const handlePromote = async (email: string) => {
    const secret = prompt("Enter ADMIN_SECRET to confirm promotion:");
    if (!secret) return;

    try {
      await api.post(
        "/admin/promote",
        { email },
        {
          headers: {
            "X-Admin-Secret": secret,
          },
        }
      );
      toast.success(`${email} has been promoted to Admin`);
      mutateUsers();
      mutateTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user. Check admin secret.");
    }
  };

  const isLoading = tasksLoading || usersLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor tasks across all user accounts and manage permissions.
        </p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "tasks"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>All Tasks ({tasksData?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Registered Users ({usersData?.length || 0})</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && activeTab === "tasks" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="p-4">Owner</th>
                <th className="p-4">Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasksData?.map((task: any) => (
                <tr key={task.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <div className="font-semibold text-foreground">{task.user.fullName}</div>
                    <div className="text-xs text-muted-foreground">{task.user.email}</div>
                  </td>
                  <td className="p-4 font-medium max-w-[200px] truncate">{task.title}</td>
                  <td className="p-4 capitalize">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        task.status === "DONE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : task.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {task.status.replace("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="p-4 capitalize">{task.priority.toLowerCase()}</td>
                  <td className="p-4 text-muted-foreground">
                    {format(new Date(task.createdAt), "yyyy-MM-dd HH:mm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && activeTab === "users" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined At</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersData?.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="p-4 font-semibold">{u.fullName}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-xs font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{format(new Date(u.createdAt), "yyyy-MM-dd")}</td>
                  <td className="p-4">
                    {u.role !== "ADMIN" ? (
                      <Button variant="outline" size="sm" onClick={() => handlePromote(u.email)}>
                        Promote to Admin
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Admin Account</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
