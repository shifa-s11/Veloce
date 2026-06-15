import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "UNAUTHORIZED", message: "No session found", details: null } },
      { status: 401 }
    );
  }

  try {
    // Server-to-server refresh — send token in body (cross-domain safe)
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Refresh failed — forcefully clear the stale cookie
      const response = NextResponse.json(data, { status: res.status });
      response.cookies.set("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    const { user, accessToken, refreshToken: newRefreshToken } = data.data;
    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      data: { user, accessToken },
      error: null,
    });

    // Rotate the refreshToken (sliding session)
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "INTERNAL_ERROR", message: "Refresh failed", details: null } },
      { status: 500 }
    );
  }
}
