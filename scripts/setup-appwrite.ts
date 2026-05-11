/**
 * Setup script for Appwrite retargeting database tables
 * Run with: npx tsx scripts/setup-appwrite.ts
 */

import { Client, TablesDB, ID } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const tablesDB = new TablesDB(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID!;

async function createTable(tableId: string, name: string, attributes: any[]) {
  try {
    // Try to get the table first
    try {
      await tablesDB.getTable({ databaseId: DATABASE_ID, tableId });
      console.log(`Table ${name} already exists`);
      return;
    } catch {
      // Table doesn't exist, create it
    }

    await tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId,
      name,
    });
    console.log(`Created table: ${name}`);

    // Add attributes
    for (const attr of attributes) {
      try {
        await tablesDB.createAttribute({
          databaseId: DATABASE_ID,
          tableId,
          ...attr,
        });
        console.log(`  Added attribute: ${attr.key}`);
      } catch (err: any) {
        console.log(`  Attribute ${attr.key} may already exist: ${err.message}`);
      }
    }
  } catch (error: any) {
    console.error(`Error creating table ${name}:`, error.message);
  }
}

async function main() {
  if (!DATABASE_ID) {
    console.error("NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID is required");
    process.exit(1);
  }

  console.log("Setting up retargeting database tables...\n");

  // WordPress Customers Table
  await createTable(
    process.env.NEXT_PUBLIC_APPWRITE_WORDPRESS_CUSTOMERS_TABLE_ID!,
    "WordPress Customers",
    [
      { key: "email", type: "string", size: 255, required: false },
      { key: "phone", type: "string", size: 20, required: true },
      { key: "first_name", type: "string", size: 100, required: false },
      { key: "last_name", type: "string", size: 100, required: false },
      { key: "city", type: "string", size: 100, required: false },
      { key: "value", type: "double", required: false },
    ]
  );

  // Call Logs Table
  await createTable(
    process.env.NEXT_PUBLIC_APPWRITE_CALL_LOGS_TABLE_ID!,
    "Call Logs",
    [
      { key: "customer_phone", type: "string", size: 20, required: true },
      { key: "customer_name", type: "string", size: 200, required: false },
      { key: "agent_name", type: "string", size: 100, required: true },
      { key: "response_type", type: "string", size: 50, required: true },
      { key: "notes", type: "string", size: 2000, required: false },
      { key: "follow_up_date", type: "datetime", required: false },
      { key: "order_placed", type: "boolean", required: true },
      { key: "order_id", type: "string", size: 50, required: false },
    ]
  );

  // Agent Orders Table
  await createTable(
    process.env.NEXT_PUBLIC_APPWRITE_AGENT_ORDERS_TABLE_ID!,
    "Agent Orders",
    [
      { key: "customer_phone", type: "string", size: 20, required: true },
      { key: "customer_name", type: "string", size: 200, required: false },
      { key: "address", type: "string", size: 1000, required: true },
      { key: "city", type: "string", size: 100, required: false },
      { key: "items", type: "string", size: 5000, required: true },
      { key: "total_price", type: "double", required: true },
      { key: "status", type: "string", size: 30, required: true },
      { key: "agent_name", type: "string", size: 100, required: true },
      { key: "notes", type: "string", size: 2000, required: false },
    ]
  );

  // Campaigns Table
  await createTable(
    process.env.NEXT_PUBLIC_APPWRITE_CAMPAIGNS_TABLE_ID!,
    "Campaigns",
    [
      { key: "name", type: "string", size: 200, required: true },
      { key: "description", type: "string", size: 2000, required: false },
      { key: "target_city", type: "string", size: 100, required: false },
      { key: "min_value", type: "double", required: false },
      { key: "max_value", type: "double", required: false },
      { key: "status", type: "string", size: 20, required: true },
      { key: "created_by", type: "string", size: 100, required: true },
    ]
  );

  console.log("\nDone! Make sure to create indexes on phone fields for performance.");
}

main().catch(console.error);
