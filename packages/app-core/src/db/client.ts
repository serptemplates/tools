import "server-only";

import { drizzle } from "drizzle-orm/neon-http";
import type { NeonQueryFunction } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "./schema";

let queryClient: NeonQueryFunction<any> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function resolveConnectionString(): string | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return url && url.trim().length > 0 ? url : null;
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = resolveConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!queryClient) {
    queryClient = neon(connectionString);
  }

  dbInstance = drizzle(queryClient, {
    schema,
    logger: process.env.NODE_ENV === "development",
  });

  return dbInstance;
}

export type Database = NonNullable<ReturnType<typeof getDb>>;
export * as dbSchema from "./schema";
