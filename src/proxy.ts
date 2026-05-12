import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AGENT_COOKIE = "agent-session";
const ALLOWED_AGENTS = ["saima", "kiran"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login page and API routes
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout")
  ) {
    return NextResponse.next();
  }

  const agent = request.cookies.get(AGENT_COOKIE)?.value;
  if (!agent || !ALLOWED_AGENTS.includes(agent)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
