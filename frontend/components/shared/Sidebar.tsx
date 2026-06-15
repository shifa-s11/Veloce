"use client";

import { useAuth } from "@/hooks/useAuth.js";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  CheckSquare,
  Users,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button.js";

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const navItems = [
    { name: "My Tasks", href: "/tasks", icon: CheckSquare },
    ...(isAdmin ? [{ name: "Admin Dashboard", href: "/admin", icon: Users }] : []),
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight">Veloce</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed bottom-0 top-16 z-40 flex flex-col border-r border-border bg-card transition-all duration-300 md:top-0 md:h-screen
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "left-0 w-64" : "-left-64 md:left-0"}
        `}
      >
        <div className="hidden h-16 items-center justify-between border-b border-border px-6 md:flex">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-6 w-6 text-primary" />
              <span className="font-bold tracking-tight text-xl">Veloce</span>
            </div>
          )}
          {collapsed && (
            <div className="flex w-full justify-center">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150
                  ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                {(!collapsed || mobileOpen) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-3">
          {mounted && (
            <Button
              variant="ghost"
              className="w-full justify-start px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-5 w-5 mr-3 text-amber-500" />
                  {(!collapsed || mobileOpen) && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 mr-3" />
                  {(!collapsed || mobileOpen) && <span>Dark Mode</span>}
                </>
              )}
            </Button>
          )}

          {(!collapsed || mobileOpen) && (
            <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user.fullName}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
                <LogOut className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}

          {collapsed && !mobileOpen && (
            <div className="flex justify-center">
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
