import { getAgentName } from "@/lib/auth";
import Nav from "@/components/Nav";

export default async function NavWrapper() {
  const agentName = await getAgentName();
  return <Nav agentName={agentName} />;
}
