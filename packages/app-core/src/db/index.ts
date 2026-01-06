import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: postgres.Sql | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, { max: 1 });
  }

  if (!db) {
    db = drizzle(client, { schema });
  }

  return db;
}

export { schema };
