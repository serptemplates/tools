import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/app-core/src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
