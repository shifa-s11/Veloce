import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // "isLoggedIn" is a lightweight JS-set cookie on the frontend domain.
  // The real refreshToken lives on the backend (onrender.com) domain and is
  // never visible to the Vercel-side middleware — that's why we use this flag.
  const hasSession = request.cookies.has("isLoggedIn");

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardPage = pathname.startsWith("/tasks") || pathname.startsWith("/admin");

  if (isDashboardPage && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    const dashboardUrl = new URL("/tasks", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname === "/") {
    const target = hasSession ? "/tasks" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/tasks/:path*", "/admin/:path*"],
};
