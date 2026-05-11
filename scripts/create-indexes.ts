/**
 * Create indexes for retargeting tables
 * Run with: npx tsx scripts/create-indexes.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { Client, TablesDB } from "node-appwrite";

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

const INDEXES: { tableEnvKey: string; name: string; column: string }[] = [
  {
    tableEnvKey: "NEXT_PUBLIC_APPWRITE_WORDPRESS_CUSTOMERS_TABLE_ID",
    name: "idx_wp_phone",
    column: "phone",
  },
  {
    tableEnvKey: "NEXT_PUBLIC_APPWRITE_CALL_LOGS_TABLE_ID",
    name: "idx_calls_phone",
    column: "customer_phone",
  },
  {
    tableEnvKey: "NEXT_PUBLIC_APPWRITE_AGENT_ORDERS_TABLE_ID",
    name: "idx_orders_phone",
    column: "customer_phone",
  },
];

async function createIndex(tableId: string, name: string, column: string) {
  try {
    // Check if index already exists
    const existing = await tablesDB.listIndexes(DATABASE_ID, tableId);
    const already = (existing.indexes || []).find((i: any) => i.key === name);
    if (already) {
      console.log(`  Index "${name}" already exists on ${tableId}`);
      return;
    }
  } catch {
    // ignore
  }

  try {
    await tablesDB.createIndex(
      DATABASE_ID,
      tableId,
      name,
      "key" as any,
      [column],
      ["ASC" as any]
    );
    console.log(`  Created index "${name}" on ${column}`);
  } catch (err: any) {
    console.error(`  Failed to create index "${name}":`, err.message);
  }
}

async function main() {
  if (!DATABASE_ID) {
    console.error("NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID is required");
    process.exit(1);
  }

  console.log("Creating indexes...\n");

  for (const idx of INDEXES) {
    const tableId = process.env[idx.tableEnvKey];
    if (!tableId || tableId.includes("TABLE_ID")) {
      console.log(`Skipping ${idx.tableEnvKey} — not configured`);
      continue;
    }
    console.log(`Table: ${tableId}`);
    await createIndex(tableId, idx.name, idx.column);
    console.log("");
  }

  console.log("Done!");
}

main().catch(console.error);
