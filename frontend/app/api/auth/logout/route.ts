import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (refreshToken) {
    // Revoke the session on the backend (fire-and-forget, ignore errors)
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  const response = NextResponse.json({ success: true, data: null, error: null });
  // Clear the HttpOnly cookie from the Vercel domain
  response.cookies.delete("refreshToken");
  return response;
}
