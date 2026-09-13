import { Pool, type PoolClient } from 'pg';

const globalDb = globalThis as unknown as { campusPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return globalDb.campusPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    // TLS options are taken from the Tiger Data URL. Never disable verification here.
  });
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
