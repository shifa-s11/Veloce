import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Server-to-server call to Render — no CORS restriction
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const { user, accessToken, refreshToken } = data.data;
    const isProduction = process.env.NODE_ENV === "production";

    // Return accessToken to client (stored in memory/Zustand only — never localStorage)
    const response = NextResponse.json({
      success: true,
      data: { user, accessToken },
      error: null,
    });

    // Set refreshToken as HttpOnly cookie on the FRONTEND (Vercel) domain
    // SameSite=Lax works because frontend and BFF are on the same domain
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "INTERNAL_ERROR", message: "Login failed", details: null } },
      { status: 500 }
    );
  }
}
