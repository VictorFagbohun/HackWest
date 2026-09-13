import { NextResponse } from 'next/server';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

export async function GET() {
  const params = new URLSearchParams({
    returnTo: `${APP_BASE_URL}/`,
    client_id: AUTH0_CLIENT_ID || '',
  });

  return NextResponse.redirect(`https://${AUTH0_DOMAIN}/v2/logout?${params}`);
}
