import 'server-only';
import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { AppError } from './errors';
let client: Auth0Client | undefined;
export function authConfigured() {
  return ['AUTH0_DOMAIN','AUTH0_CLIENT_ID','AUTH0_CLIENT_SECRET','AUTH0_SECRET','APP_BASE_URL'].every(key => Boolean(process.env[key]));
}
export function getAuth0() {
  if (!authConfigured()) throw new AppError(503,'AUTH_NOT_CONFIGURED','Sign-in is not configured yet.');
  return client ??= new Auth0Client({ signInReturnToPath:'/dashboard' });
}
