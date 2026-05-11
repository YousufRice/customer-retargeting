import { GraphQLClient } from "graphql-request";

const endpoint = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/graphql`;

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  },
});

/** Lightweight query for dashboard counts */
export async function getDashboardCounts() {
  const query = `
    query {
      databasesListCollections(
        databaseId: "${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}"
      ) {
        total
      }
    }
  `;
  try {
    const data = await graphqlClient.request(query);
    return data as any;
  } catch {
    return null;
  }
}
