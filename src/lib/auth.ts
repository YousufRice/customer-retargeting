import { cookies } from "next/headers";

export const AGENT_COOKIE = "agent-session";
export const ALLOWED_AGENTS = ["saima", "kiran"];

export async function getAgentName(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const agent = cookieStore.get(AGENT_COOKIE)?.value;
  if (agent && ALLOWED_AGENTS.includes(agent)) {
    return agent;
  }
  return undefined;
}

export async function isAuthenticated(): Promise<boolean> {
  return !!(await getAgentName());
}
