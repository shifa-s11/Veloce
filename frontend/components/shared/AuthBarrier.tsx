"use client";

import { useAuth } from "@/hooks/useAuth.js";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function AuthBarrier({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (!isInitialized && !isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Securing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
