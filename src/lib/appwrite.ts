import { Client, TablesDB, ID, Query } from "appwrite";

// Client for browser usage
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Server-side client configuration
let serverClient: any = null;
let serverTablesDB: any = null;

if (typeof window === "undefined" && process.env.APPWRITE_API_KEY) {
  try {
    const {
      Client: ServerClient,
      TablesDB: ServerTablesDB,
    } = require("node-appwrite");
    serverClient = new ServerClient()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY);
    serverTablesDB = new ServerTablesDB(serverClient);
  } catch {
    // Silenced — server-side Appwrite client not available without API key
  }
}

export const tablesDB = serverTablesDB || new TablesDB(client);
export { client, ID, Query };

// Existing website database
export const EXISTING_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const EXISTING_CUSTOMERS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CUSTOMERS_TABLE_ID!;
export const EXISTING_ORDERS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ORDERS_TABLE_ID!;
export const EXISTING_ORDER_ITEMS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ORDER_ITEMS_TABLE_ID!;
export const EXISTING_ADDRESSES_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ADDRESSES_TABLE_ID!;
export const EXISTING_PRODUCTS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_TABLE_ID!;
export const EXISTING_PRODUCT_IMAGES_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_TABLE_ID!;

// Retargeting database (new)
export const RETARGETING_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_RETARGETING_DATABASE_ID!;
export const WORDPRESS_CUSTOMERS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_WORDPRESS_CUSTOMERS_TABLE_ID!;
export const CALL_LOGS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CALL_LOGS_TABLE_ID!;
export const AGENT_ORDERS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_AGENT_ORDERS_TABLE_ID!;
export const CAMPAIGNS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CAMPAIGNS_TABLE_ID!;
