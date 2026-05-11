import { Client, Account } from "appwrite";

export const appwriteClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const appwriteAccount = new Account(appwriteClient);
