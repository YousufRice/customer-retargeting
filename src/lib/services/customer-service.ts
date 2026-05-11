"use server";

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
import { normalizePhone } from "@/lib/utils";

export async function getAllWordPressCustomers(): Promise<WordPressCustomer[]> {
  try {
    const response = await tablesDB.listRows({
      databaseId: RETARGETING_DATABASE_ID,
      tableId: WORDPRESS_CUSTOMERS_TABLE_ID,
      queries: [Query.limit(10000)],
    });
    return (response.rows || []) as unknown as WordPressCustomer[];
  } catch (error) {
    console.error("Error fetching WordPress customers:", error);
    return [];
  }
}

export async function getAllExistingCustomers(): Promise<ExistingCustomer[]> {
  try {
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_CUSTOMERS_TABLE_ID,
      queries: [Query.limit(10000)],
    });
    return (response.rows || []) as unknown as ExistingCustomer[];
  } catch (error) {
    console.error("Error fetching existing customers:", error);
    return [];
  }
  }

export async function getExistingCustomerByPhone(
  phone: string
): Promise<ExistingCustomer | null> {
  try {
    const normalized = normalizePhone(phone);
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_CUSTOMERS_TABLE_ID,
      queries: [Query.equal("phone", normalized), Query.limit(1)],
    });
    const rows = response.rows || [];
    if (rows.length > 0) return rows[0] as unknown as ExistingCustomer;

    // Try with +92 prefix
    const withPlus = normalized.startsWith("92") ? "+" + normalized : normalized;
    const response2 = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_CUSTOMERS_TABLE_ID,
      queries: [Query.equal("phone", withPlus), Query.limit(1)],
    });
    const rows2 = response2.rows || [];
    if (rows2.length > 0) return rows2[0] as unknown as ExistingCustomer;

    return null;
  } catch (error) {
    console.error("Error fetching customer by phone:", error);
    return null;
  }
}

export async function getExistingCustomerOrders(
  customerId: string
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
    return (response.rows || []) as unknown as ExistingOrder[];
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}

export async function getOrderItems(orderId: string): Promise<ExistingOrderItem[]> {
  try {
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_ORDER_ITEMS_TABLE_ID,
      queries: [Query.equal("order_id", orderId)],
    });
    return (response.rows || []) as unknown as ExistingOrderItem[];
  } catch (error) {
    console.error("Error fetching order items:", error);
    return [];
  }
}

export async function getOrderAddress(orderId: string): Promise<ExistingAddress | null> {
  try {
    const response = await tablesDB.listRows({
      databaseId: EXISTING_DATABASE_ID,
      tableId: EXISTING_ADDRESSES_TABLE_ID,
      queries: [Query.equal("order_id", orderId), Query.limit(1)],
    });
    const rows = response.rows || [];
    if (rows.length > 0) return rows[0] as unknown as ExistingAddress;
    return null;
  } catch (error) {
    console.error("Error fetching order address:", error);
    return null;
  }
}

export async function searchUnifiedCustomers(
  query: string
): Promise<UnifiedCustomer[]> {
  const wpCustomers = await getAllWordPressCustomers();
  const existingCustomers = await getAllExistingCustomers();

  const unifiedMap = new Map<string, UnifiedCustomer>();

  // Process WordPress customers
  for (const wp of wpCustomers) {
    const normalized = normalizePhone(wp.phone);
    const existing = existingCustomers.find(
      (c) => normalizePhone(c.phone) === normalized
    );

    const fullName = `${wp.first_name} ${wp.last_name}`.trim();
    const lifetimeValue = wp.value + (existing ? 0 : 0); // Will add existing orders value below

    unifiedMap.set(normalized, {
      phone: normalized,
      firstName: wp.first_name,
      lastName: wp.last_name,
      fullName,
      email: wp.email || existing?.email || "",
      city: wp.city,
      lifetimeValue,
      source: existing ? "both" : "wordpress",
      wordpressData: wp,
      websiteData: existing,
      orderCount: 0,
    });
  }

  // Process existing customers
  for (const ec of existingCustomers) {
    const normalized = normalizePhone(ec.phone);
    const existing = unifiedMap.get(normalized);

    if (existing) {
      existing.websiteData = ec;
      existing.source = "both";
      if (ec.email && !existing.email) existing.email = ec.email;
    } else {
      const nameParts = ec.full_name?.split(" ") || ["", ""];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      unifiedMap.set(normalized, {
        phone: normalized,
        firstName,
        lastName,
        fullName: ec.full_name || "",
        email: ec.email || "",
        city: "",
        lifetimeValue: 0,
        source: "website",
        websiteData: ec,
        orderCount: 0,
      });
    }
  }

  // Fetch orders for existing customers to calculate lifetime value and order count
  for (const [phone, customer] of unifiedMap) {
    if (customer.websiteData) {
      try {
        const orders = await getExistingCustomerOrders(customer.websiteData.$id);
        customer.orderCount = orders.length;
        const ordersValue = orders.reduce(
          (sum, o) => (o.status !== "returned" ? sum + (o.total_price || 0) : sum),
          0
        );
        customer.lifetimeValue += ordersValue;
        if (orders.length > 0) {
          customer.lastOrderDate = orders[0].$createdAt;
        }
      } catch {
        // ignore
      }
    }
  }

  const allCustomers = Array.from(unifiedMap.values());

  if (!query) return allCustomers;

  const lowerQuery = query.toLowerCase();
  return allCustomers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.city.toLowerCase().includes(lowerQuery)
  );
}

export async function getUnifiedCustomerByPhone(
  phone: string
): Promise<UnifiedCustomer | null> {
  const customers = await searchUnifiedCustomers("");
  const normalized = normalizePhone(phone);
  return customers.find((c) => c.phone === normalized) || null;
}
