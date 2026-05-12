// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { Client as ServerClient, Account as ServerAccount } from "node-appwrite";

// Initialize Server Appwrite client with API key
const serverClient = new ServerClient()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const account = new ServerAccount(serverClient);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Create a new email/password session using server SDK (bypasses client rate limits)
    await account.createEmailPasswordSession(email, password);

    // Fetch the account to obtain labels (used for agent validation)
    const accountInfo = await account.get();
    const labels: string[] = (accountInfo.labels as unknown as string[]) || [];
    const agent = labels.map((l) => l.toLowerCase().trim()).find((l) =>
      ["saima", "kiran"].includes(l)
    );

    if (!agent) {
      // Not an allowed agent – delete the newly created session
      await account.deleteSession("current");
      return NextResponse.json({ error: "Access denied. Only authorized agents can log in." }, { status: 403 });
    }

    // Set cookie for middleware checks (same as existing /api/login route)
    const response = NextResponse.json({ success: true, agent });
    response.cookies.set("agent-session", agent, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });
    return response;
  } catch (err: any) {
    // If Appwrite returns a rate limit error (429), forward that status
    if (err.code === 429) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }
    const message = err?.message || "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
