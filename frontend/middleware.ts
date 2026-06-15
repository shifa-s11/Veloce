import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has("refreshToken");

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardPage = pathname.startsWith("/tasks") || pathname.startsWith("/admin") || pathname === "/";

  if (isDashboardPage && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasRefreshToken) {
    const dashboardUrl = new URL("/tasks", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname === "/") {
    const dashboardUrl = new URL("/tasks", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/tasks/:path*", "/admin/:path*"],
};
