import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { db } from '../lib/db';

function loadEnvLocal() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

async function main() {
  const pool = db();
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(87412001)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of (await readdir('db/migrations')).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile(`db/migrations/${name}`, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const previous = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [name]);
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== checksum) throw new Error(`Migration changed after application: ${name}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        const existing = await client.query("SELECT to_regclass('users') AS users");
        if (name === '001_core.sql' && existing.rows[0].users) {
          if (!process.argv.includes('--baseline')) throw new Error('Existing schema detected. Review 001_core.sql, then use npm run db:migrate -- --baseline to adopt it.');
          const expected: Record<string, string[]> = {
            users: ['id','name','university','major','level','xp','coins','character','stats','created_at','updated_at'],
            quests: ['id','title','description','category','xp_reward','coin_reward','location_code','frequency','created_at'],
            quest_events: ['id','user_id','quest_id','xp_gained','coins_gained','verified_by','completed_at'],
            items: ['id','name','category','cost'], user_items: ['user_id','item_id','x','y','placed','acquired_at'],
            friendships: ['user_id','friend_id','status','created_at'],
          };
          for (const [table, columns] of Object.entries(expected)) {
            const actual = await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1', [table]);
            if (columns.some(column => !actual.rows.some(r => r.column_name === column))) throw new Error(`Baseline mismatch in ${table}`);
          }
          console.log('Adopting the reviewed existing core schema.');
        } else await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1,$2)', [name, checksum]);
        await client.query('COMMIT');
        console.log(`Applied ${name}`);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Migration failed'); process.exitCode = 1;
  } finally {
    await client.query('SELECT pg_advisory_unlock(87412001)'); client.release(); await pool.end();
  }
}

main();
