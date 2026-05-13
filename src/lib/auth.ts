import { cookies } from "next/headers";

export const AUTH_COOKIE = "auth-session";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value === "true";
}

export async function getAgentName(): Promise<string | undefined> {
  if (await isAuthenticated()) {
    return "Agent";
  }
  return undefined;
}
