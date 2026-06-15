"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { useSSE } from "@/hooks/useSSE";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSSE(true);

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
