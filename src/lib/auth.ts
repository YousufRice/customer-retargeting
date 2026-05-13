import { cookies } from "next/headers";
import { SESSION_COOKIE, decrypt } from "./session";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const payload = await decrypt(token);
  return payload !== null;
}

export async function getAgentName(): Promise<string | undefined> {
  if (await isAuthenticated()) {
    return "Agent";
  }
  return undefined;
}
