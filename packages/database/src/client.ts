import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

export type MyfitDatabase = ReturnType<typeof createDatabase>["db"];

export async function pingDatabase(database: MyfitDatabase) {
  await database.execute(sql`select 1`);
}
