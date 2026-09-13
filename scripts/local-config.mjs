import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
// Updates only local configuration; never prints secrets.
let env = readFileSync('.env.local','utf8');
env = env.replace(/^DATABASE_URL=(.*)$/m,(_,raw) => {
  const url = new URL(raw.trim().replace(/^["']|["']$/g,''));
  url.searchParams.set('sslmode','verify-full');
  url.searchParams.set('sslrootcert','certs/tiger-ca.pem');
  return `DATABASE_URL="${url}"`;
});
const defaults = { AUTH0_SECRET:randomBytes(32).toString('hex'),APP_BASE_URL:'http://localhost:3000',WORLD_GRID_SIZE:'20',GEMINI_MODEL:'gemini-3.5-flash' };
for (const [key,value] of Object.entries(defaults)) if (!new RegExp(`^${key}=`, 'm').test(env)) env += `\n${key}="${value}"\n`;
writeFileSync('.env.local',env);
console.log('Updated local TLS configuration and generated any missing session settings.');
