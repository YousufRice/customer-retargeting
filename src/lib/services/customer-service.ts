"use server";

import { unstable_cache } from "next/cache";
import {
  tablesDB,
  EXISTING_DATABASE_ID,
  EXISTING_CUSTOMERS_TABLE_ID,
  EXISTING_ORDERS_TABLE_ID,
  EXISTING_ORDER_ITEMS_TABLE_ID,
  EXISTING_ADDRESSES_TABLE_ID,
  RETARGETING_DATABASE_ID,
  WORDPRESS_CUSTOMERS_TABLE_ID,
  Query,
} from "@/lib/appwrite";
import {
  WordPressCustomer,
  ExistingCustomer,
  ExistingOrder,
  ExistingOrderItem,
  UnifiedCustomer,
  ExistingAddress,
} from "@/lib/types";
import { normalizePhone, sanitizeAppwriteDoc } from "@/lib/utils";
import { logError } from "@/lib/logger";

const BATCH_SIZE = 500;

async function fetchAllRows(
  databaseId: string,
  tableId: string,
): Promise<any[]> {
  const allRows: any[] = [];
  let offset = 0;

  while (true) {
    const response = await tablesDB.listRows({
      databaseId,
      tableId,
      queries: [Query.limit(BATCH_SIZE), Query.offset(offset)],
    });
    const rows = response.rows || [];
    allRows.push(...rows);
    if (rows.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return allRows;
}

export async function getAllWordPressCustomers(): Promise<WordPressCustomer[]> {
  try {
    const rows = await fetchAllRows(
      RETARGETING_DATABASE_ID,
      WORDPRESS_CUSTOMERS_TABLE_ID,
    );
    return rows.map((r) => sanitizeAppwriteDoc<WordPressCustomer>(r));
  } catch (error) {
    logError("Error fetching WordPress customers", error);
    return [];
  }
}

export async function getAllExistingCustomers(): Promise<ExistingCustomer[]> {
  try {
    const rows = await fetchAllRows(
      EXISTING_DATABASE_ID,
      EXISTING_CUSTOMERS_TABLE_ID,
    );
    return rows.map((r) => sanitizeAppwriteDoc<ExistingCustomer>(r));
  } catch (error) {
    logError("Error fetching existing customers", error);
    return [];
  }
}

export async function getExistingCustomerByPhone(
  phone: string,
): Promise<ExistingCustomer | null> {
  try {
    const normalized = normalizePhone(phone);
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_CUSTOMERS_TABLE_ID,
      queries: [Query.equal("phone", normalized), Query.limit(1)],
    });
    const rows = response.rows || [];
    if (rows.length > 0) return sanitizeAppwriteDoc<ExistingCustomer>(rows[0]);

    const withPlus = normalized.startsWith("92")
      ? "+" + normalized
      : normalized;
    const response2 = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_CUSTOMERS_TABLE_ID,
      queries: [Query.equal("phone", withPlus), Query.limit(1)],
    });
    const rows2 = response2.rows || [];
    if (rows2.length > 0)
      return sanitizeAppwriteDoc<ExistingCustomer>(rows2[0]);

    return null;
  } catch (error) {
    logError("Error fetching customer by phone", error);
    return null;
  }
}

export async function getExistingCustomerOrders(
  customerId: string,
): Promise<ExistingOrder[]> {
  try {
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_ORDERS_TABLE_ID,
      queries: [
        Query.equal("customer_id", customerId),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    });
    return (response.rows || []).map((r: any) =>
      sanitizeAppwriteDoc<ExistingOrder>(r),
    );
  } catch (error) {
    logError("Error fetching customer orders", error);
    return [];
  }
}

export async function getOrderItems(
  orderId: string,
): Promise<ExistingOrderItem[]> {
  try {
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_ORDER_ITEMS_TABLE_ID,
      queries: [Query.equal("order_id", orderId)],
    });
    return (response.rows || []).map((r: any) =>
      sanitizeAppwriteDoc<ExistingOrderItem>(r),
    );
  } catch (error) {
    logError("Error fetching order items", error);
    return [];
  }
}

export async function getOrderAddress(
  orderId: string,
): Promise<ExistingAddress | null> {
  try {
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_ADDRESSES_TABLE_ID,
      queries: [Query.equal("order_id", orderId), Query.limit(1)],
    });
    const rows = response.rows || [];
    if (rows.length > 0) return sanitizeAppwriteDoc<ExistingAddress>(rows[0]);
    return null;
  } catch (error) {
    logError("Error fetching order address", error);
    return null;
  }
}

// ───────────────────────────────────────────────
// Split fetchers — one source at a time
// ───────────────────────────────────────────────

/** Fetch website (existing) customers only */
const getCachedWebsiteCustomers = unstable_cache(
  async (): Promise<UnifiedCustomer[]> => {
    const customers = await getAllExistingCustomers();

    // Fetch all orders once to compute lifetime values
    const ordersPromises = customers.map(async (ec) => {
      try {
        const orders = await getExistingCustomerOrders(ec.$id);
        const totalValue = orders.reduce(
          (sum, o) =>
            o.status !== "returned" ? sum + (o.total_price || 0) : sum,
          0,
        );
        return { customerId: ec.$id, orders, totalValue };
      } catch {
        return {
          customerId: ec.$id,
          orders: [] as ExistingOrder[],
          totalValue: 0,
        };
      }
    });
    const orderData = await Promise.all(ordersPromises);
    const orderMap = new Map(orderData.map((d) => [d.customerId, d]));

    return customers.map((ec) => {
      const normalized = normalizePhone(ec.phone);
      const nameParts = ec.full_name?.split(" ") || ["", ""];
      const od = orderMap.get(ec.$id);
      const orders = od?.orders ?? [];
      return {
        phone: normalized,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        fullName: ec.full_name || "",
        email: ec.email || "",
        city: "",
        lifetimeValue: od?.totalValue ?? 0,
        source: "website" as const,
        websiteData: ec,
        orderCount: orders.length,
        lastOrderDate: orders.length > 0 ? orders[0].$createdAt : undefined,
      };
    });
  },
  ["website-customers"],
  { revalidate: 3600, tags: ["customers"] },
);

/** Fetch WordPress customers, excluding any email already present in website table */
const getCachedWordPressCustomers = unstable_cache(
  async (): Promise<UnifiedCustomer[]> => {
    const [wpCustomers, existingCustomers] = await Promise.all([
      getAllWordPressCustomers(),
      getAllExistingCustomers(),
    ]);

    // Build set of existing emails for deduplication
    const websiteEmails = new Set(
      existingCustomers.map((c) => (c.email || "").toLowerCase().trim()),
    );

    return wpCustomers
      .filter((wp) => {
        const email = (wp.email || "").toLowerCase().trim();
        // Keep if no email overlap with website table
        return !email || !websiteEmails.has(email);
      })
      .map((wp) => {
        const normalized = normalizePhone(wp.phone);
        const fullName = `${wp.first_name} ${wp.last_name}`.trim();
        return {
          phone: normalized,
          firstName: wp.first_name,
          lastName: wp.last_name,
          fullName,
          email: wp.email || "",
          city: wp.city,
          lifetimeValue: wp.value || 0,
          source: "wordpress" as const,
          wordpressData: wp,
          orderCount: 0,
        };
      });
  },
  ["wordpress-customers"],
  { revalidate: 3600, tags: ["customers"] },
);

export async function getWebsiteCustomers(): Promise<UnifiedCustomer[]> {
  return getCachedWebsiteCustomers();
}

export async function getWordPressCustomers(): Promise<UnifiedCustomer[]> {
  return getCachedWordPressCustomers();
}

/** Fetch customers by source. Defaults to 'website'. */
export async function getCustomersBySource(
  source: "website" | "wordpress",
): Promise<UnifiedCustomer[]> {
  if (source === "website") return getWebsiteCustomers();
  return getWordPressCustomers();
}

/** Search within a single source */
export async function searchCustomers(
  source: "website" | "wordpress",
  query: string,
): Promise<UnifiedCustomer[]> {
  const customers = await getCustomersBySource(source);
  if (!query) return customers;

  const lowerQuery = query.toLowerCase();
  return customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.city.toLowerCase().includes(lowerQuery),
  );
}

export async function getCustomerByPhone(
  phone: string,
): Promise<UnifiedCustomer | null> {
  const normalized = normalizePhone(phone);
  // Check website first
  const website = await getWebsiteCustomers();
  const found = website.find((c) => c.phone === normalized);
  if (found) return found;
  // Fallback to WordPress
  const wp = await getWordPressCustomers();
  return wp.find((c) => c.phone === normalized) || null;
}
