"use server";

import {
  tablesDB,
  RETARGETING_DATABASE_ID,
  CALL_LOGS_TABLE_ID,
  Query,
  ID,
} from "@/lib/appwrite";
import { CallLog, CallResponseType } from "@/lib/types";
import { logError } from "@/lib/logger";

export async function getCallLogs(
  customerPhone?: string,
  limit = 100,
): Promise<CallLog[]> {
  try {
    const queries: string[] = [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ];
    if (customerPhone) {
      queries.push(Query.equal("customer_phone", customerPhone));
    }
    const response = await tablesDB.listRows({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: CALL_LOGS_TABLE_ID,
      queries,
    });
    return (response.rows || []) as unknown as CallLog[];
  } catch (error) {
    logError("Error fetching call logs", error);
    return [];
  }
}

export async function getCallLogsToday(): Promise<CallLog[]> {
  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const response = await tablesDB.listRows({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: CALL_LOGS_TABLE_ID,
      queries: [
        Query.greaterThanEqual("$createdAt", startOfDay.toISOString()),
        Query.orderDesc("$createdAt"),
        Query.limit(1000),
      ],
    });
    return (response.rows || []) as unknown as CallLog[];
  } catch (error) {
    logError("Error fetching today's call logs", error);
    return [];
  }
}

export async function getPendingFollowUps(): Promise<CallLog[]> {
  try {
    const now = new Date().toISOString();
    const response = await tablesDB.listRows({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: CALL_LOGS_TABLE_ID,
      queries: [
        Query.greaterThanEqual("follow_up_date", now),
        Query.orderAsc("follow_up_date"),
        Query.limit(500),
      ],
    });
    return (response.rows || []) as unknown as CallLog[];
  } catch (error) {
    logError("Error fetching follow-ups", error);
    return [];
  }
}

export async function createCallLog(data: {
  customer_phone: string;
  customer_name: string;
  agent_name: string;
  response_type: CallResponseType;
  notes: string;
  follow_up_date?: string;
  order_placed: boolean;
  order_id?: string;
}): Promise<CallLog | null> {
  try {
    const response = await tablesDB.createRow({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: CALL_LOGS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        customer_phone: data.customer_phone,
        customer_name: data.customer_name,
        agent_name: data.agent_name,
        response_type: data.response_type,
        notes: data.notes,
        follow_up_date: data.follow_up_date || null,
        order_placed: data.order_placed,
        order_id: data.order_id || null,
      },
    });
    return response as unknown as CallLog;
  } catch (error) {
    logError("Error creating call log", error);
    return null;
  }
}

export async function getCallStats() {
  const today = await getCallLogsToday();
  const followUps = await getPendingFollowUps();

  const stats = {
    totalCallsToday: today.length,
    answeredCalls: today.filter((c) =>
      [
        "answered_ordered",
        "answered_interested",
        "answered_not_interested",
      ].includes(c.response_type),
    ).length,
    ordersToday: today.filter((c) => c.order_placed).length,
    pendingFollowUps: followUps.length,
    byResponse: {} as Record<string, number>,
  };

  for (const call of today) {
    stats.byResponse[call.response_type] =
      (stats.byResponse[call.response_type] || 0) + 1;
  }

  return stats;
}
