/**
 * Setup script for Appwrite retargeting database tables
 * Run with: npx tsx scripts/setup-appwrite.ts
 *
 * If table IDs in .env are placeholders, this script auto-creates
 * tables with real IDs and prints them for you to save.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { Client, TablesDB, ID } from "node-appwrite";

// Inline .env loader
function loadEnv(path = ".env") {
  try {
    const content = readFileSync(resolve(path), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    /* ignore missing .env */
  }
}
loadEnv();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const tablesDB = new TablesDB(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID!;

type AttrDef =
  | { type: "string"; key: string; size: number; required: boolean }
  | { type: "integer"; key: string; required: boolean }
  | { type: "float"; key: string; required: boolean }
  | { type: "boolean"; key: string; required: boolean }
  | { type: "datetime"; key: string; required: boolean };

function isPlaceholder(id: string): boolean {
  // Real Appwrite IDs are hex-like. Placeholders have letters/underscores.
  return !id || /^[A-Z_]+$/.test(id) || id.includes("_TABLE_ID");
}

async function addAttribute(databaseId: string, tableId: string, attr: AttrDef) {
  switch (attr.type) {
    case "string":
      await tablesDB.createStringColumn(databaseId, tableId, attr.key, attr.size, attr.required);
      break;
    case "integer":
      await tablesDB.createIntegerColumn(databaseId, tableId, attr.key, attr.required);
      break;
    case "float":
      await tablesDB.createFloatColumn(databaseId, tableId, attr.key, attr.required);
      break;
    case "boolean":
      await tablesDB.createBooleanColumn(databaseId, tableId, attr.key, attr.required);
      break;
    case "datetime":
      await tablesDB.createDatetimeColumn(databaseId, tableId, attr.key, attr.required);
      break;
  }
}

async function getOrCreateTable(
  envKey: string,
  name: string,
  attributes: AttrDef[]
): Promise<string> {
  let tableId = process.env[envKey]!;

  // If placeholder, generate a real ID and create the table
  if (isPlaceholder(tableId)) {
    tableId = ID.unique();
    console.log(`\n[${name}] Placeholder detected. Creating table with auto ID: ${tableId}`);
    try {
      await tablesDB.createTable(DATABASE_ID, tableId, name);
      console.log(`  Created table: ${name}`);
    } catch (err: any) {
      console.error(`  Failed to create table ${name}:`, err.message);
      throw err;
    }
  } else {
    // Real ID provided — check if table exists
    try {
      await tablesDB.getTable(DATABASE_ID, tableId);
      console.log(`\n[${name}] Table already exists (ID: ${tableId})`);
    } catch {
      // Doesn't exist, create it
      try {
        await tablesDB.createTable(DATABASE_ID, tableId, name);
        console.log(`\n[${name}] Created table with provided ID: ${tableId}`);
      } catch (err: any) {
        console.error(`  Failed to create table ${name}:`, err.message);
        throw err;
      }
    }
  }

  // Add attributes
  for (const attr of attributes) {
    try {
      await addAttribute(DATABASE_ID, tableId, attr);
      console.log(`  Added column: ${attr.key}`);
    } catch (err: any) {
      // Column likely already exists
      console.log(`  Column ${attr.key} already exists or error: ${err.message}`);
    }
  }

  return tableId;
}

async function main() {
  if (!DATABASE_ID) {
    console.error("NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID is required in .env");
    process.exit(1);
  }

  console.log("Database ID:", DATABASE_ID);
  console.log("Setting up retargeting tables...\n");

  const ids: Record<string, string> = {};

  ids.wordpress = await getOrCreateTable(
    "NEXT_PUBLIC_APPWRITE_WORDPRESS_CUSTOMERS_TABLE_ID",
    "WordPress Customers",
    [
      { type: "string", key: "email", size: 255, required: false },
      { type: "string", key: "phone", size: 20, required: true },
      { type: "string", key: "first_name", size: 100, required: false },
      { type: "string", key: "last_name", size: 100, required: false },
      { type: "string", key: "city", size: 100, required: false },
      { type: "float", key: "value", required: false },
    ]
  );

  ids.callLogs = await getOrCreateTable(
    "NEXT_PUBLIC_APPWRITE_CALL_LOGS_TABLE_ID",
    "Call Logs",
    [
      { type: "string", key: "customer_phone", size: 20, required: true },
      { type: "string", key: "customer_name", size: 200, required: false },
      { type: "string", key: "agent_name", size: 100, required: true },
      { type: "string", key: "response_type", size: 50, required: true },
      { type: "string", key: "notes", size: 2000, required: false },
      { type: "datetime", key: "follow_up_date", required: false },
      { type: "boolean", key: "order_placed", required: true },
      { type: "string", key: "order_id", size: 50, required: false },
    ]
  );

  ids.agentOrders = await getOrCreateTable(
    "NEXT_PUBLIC_APPWRITE_AGENT_ORDERS_TABLE_ID",
    "Agent Orders",
    [
      { type: "string", key: "customer_phone", size: 20, required: true },
      { type: "string", key: "customer_name", size: 200, required: false },
      { type: "string", key: "address", size: 1000, required: true },
      { type: "string", key: "city", size: 100, required: false },
      { type: "string", key: "items", size: 5000, required: true },
      { type: "float", key: "total_price", required: true },
      { type: "string", key: "status", size: 30, required: true },
      { type: "string", key: "agent_name", size: 100, required: true },
      { type: "string", key: "notes", size: 2000, required: false },
    ]
  );

  ids.campaigns = await getOrCreateTable(
    "NEXT_PUBLIC_APPWRITE_CAMPAIGNS_TABLE_ID",
    "Campaigns",
    [
      { type: "string", key: "name", size: 200, required: true },
      { type: "string", key: "description", size: 2000, required: false },
      { type: "string", key: "target_city", size: 100, required: false },
      { type: "float", key: "min_value", required: false },
      { type: "float", key: "max_value", required: false },
      { type: "string", key: "status", size: 20, required: true },
      { type: "string", key: "created_by", size: 100, required: true },
    ]
  );

  console.log("\n\n=== SAVE THESE TO YOUR .env FILE ===");
  console.log(`NEXT_PUBLIC_APPWRITE_WORDPRESS_CUSTOMERS_TABLE_ID=${ids.wordpress}`);
  console.log(`NEXT_PUBLIC_APPWRITE_CALL_LOGS_TABLE_ID=${ids.callLogs}`);
  console.log(`NEXT_PUBLIC_APPWRITE_AGENT_ORDERS_TABLE_ID=${ids.agentOrders}`);
  console.log(`NEXT_PUBLIC_APPWRITE_CAMPAIGNS_TABLE_ID=${ids.campaigns}`);
  console.log("\nDone! Add a `phone` index to wordpress_customers for fast lookups.");
}

main().catch(console.error);
