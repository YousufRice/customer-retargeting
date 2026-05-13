import { NextResponse } from "next/server";
import { SESSION_COOKIE, encrypt, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password || password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await encrypt();

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);

  return response;
}
