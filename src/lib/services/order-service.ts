"use server";

import {
  tablesDB,
  RETARGETING_DATABASE_ID,
  AGENT_ORDERS_TABLE_ID,
  Query,
  ID,
} from "@/lib/appwrite";
import { AgentOrder, AgentOrderItem } from "@/lib/types";

export async function getAgentOrders(
  customerPhone?: string,
  limit = 100
): Promise<AgentOrder[]> {
  try {
    const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(limit)];
    if (customerPhone) {
      queries.push(Query.equal("customer_phone", customerPhone));
    }
    const response = await tablesDB.listRows({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: AGENT_ORDERS_TABLE_ID,
      queries,
    });
    return (response.rows || []) as unknown as AgentOrder[];
  } catch (error) {
    console.error("Error fetching agent orders:", error);
    return [];
  }
}

export async function getAgentOrdersToday(): Promise<AgentOrder[]> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const response = await tablesDB.listRows({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: AGENT_ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual("$createdAt", startOfDay.toISOString()),
        Query.orderDesc("$createdAt"),
        Query.limit(1000),
      ],
    });
    return (response.rows || []) as unknown as AgentOrder[];
  } catch (error) {
    console.error("Error fetching today's agent orders:", error);
    return [];
  }
}

export async function createAgentOrder(data: {
  customer_phone: string;
  customer_name: string;
  address: string;
  city: string;
  items: AgentOrderItem[];
  total_price: number;
  agent_name: string;
  notes?: string;
}): Promise<AgentOrder | null> {
  try {
    const response = await tablesDB.createRow({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: AGENT_ORDERS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        customer_phone: data.customer_phone,
        customer_name: data.customer_name,
        address: data.address,
        city: data.city,
        items: JSON.stringify(data.items),
        total_price: data.total_price,
        status: "pending",
        agent_name: data.agent_name,
        notes: data.notes || "",
      },
    });
    return response as unknown as AgentOrder;
  } catch (error) {
    console.error("Error creating agent order:", error);
    return null;
  }
}

export async function updateAgentOrderStatus(
  orderId: string,
  status: AgentOrder["status"]
): Promise<AgentOrder | null> {
  try {
    const response = await tablesDB.updateRow({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: AGENT_ORDERS_TABLE_ID,
      rowId: orderId,
      data: { status },
    });
    return response as unknown as AgentOrder;
  } catch (error) {
    console.error("Error updating agent order:", error);
    return null;
  }
}
