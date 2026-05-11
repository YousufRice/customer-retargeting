import { NextResponse } from "next/server";

const ALLOWED_AGENTS = ["saima", "kiran"];

export async function POST(request: Request) {
  const { agent } = await request.json();

  if (!agent || !ALLOWED_AGENTS.includes(agent)) {
    return NextResponse.json({ error: "Invalid agent" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, agent });
  response.cookies.set("agent-session", agent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}
