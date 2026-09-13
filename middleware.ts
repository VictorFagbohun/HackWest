import { NextResponse, type NextRequest } from 'next/server';
import { authConfigured, getAuth0 } from './lib/auth0';
// Next 15 only picks up `middleware.ts`; this mounts Auth0's /auth/login, /auth/callback and /auth/logout routes.
export async function middleware(request: NextRequest) {
  if (!authConfigured()) {
    if (request.nextUrl.pathname.startsWith('/auth/')) return NextResponse.json({ success:false,error:{ code:'AUTH_NOT_CONFIGURED',message:'Sign-in is not configured yet.' } }, { status:503 });
    return NextResponse.next();
  }
  return getAuth0().middleware(request);
}
export const config = { matcher:['/((?!_next/static|_next/image|game/|favicon.ico|sitemap.xml|robots.txt).*)'] };
