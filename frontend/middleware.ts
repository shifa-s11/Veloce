import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The refreshToken cookie is now set by the Next.js BFF on the Vercel domain,
  // so middleware can read it correctly without any cross-domain issues.
  const hasSession = request.cookies.has("refreshToken");

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardPage = pathname.startsWith("/tasks") || pathname.startsWith("/admin");

  if (isDashboardPage && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/tasks" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/tasks/:path*", "/admin/:path*"],
};
