import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __neonPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida.");
}

export const pool =
  global.__neonPool ??
  new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.__neonPool = pool;
}