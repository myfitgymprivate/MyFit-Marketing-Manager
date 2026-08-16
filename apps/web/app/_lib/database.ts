import { createDatabase } from "@myfit/database";

const globalDatabase = globalThis as typeof globalThis & {
  myfitDatabase?: ReturnType<typeof createDatabase>;
};

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  globalDatabase.myfitDatabase ??= createDatabase(connectionString);
  return globalDatabase.myfitDatabase.db;
}
