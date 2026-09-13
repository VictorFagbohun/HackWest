import { NextResponse, type NextRequest } from 'next/server';
import { authConfigured, getAuth0 } from './lib/auth0';
import { TUTORIAL_REPLAY_COOKIE } from './lib/tutorial';
// Next 15 only picks up `middleware.ts`; this mounts Auth0's /auth/login, /auth/callback and /auth/logout routes.
export async function middleware(request: NextRequest) {
  // Hitting a dashboard URL while signed out redirects to /login and then to a fixed
  // returnTo, so remember the replay intent before `?tutorial=1` is lost.
  const replayTutorial = request.nextUrl.searchParams.get('tutorial') === '1';
  if (!authConfigured()) {
    if (request.nextUrl.pathname.startsWith('/auth/')) return NextResponse.json({ success:false,error:{ code:'AUTH_NOT_CONFIGURED',message:'Sign-in is not configured yet.' } }, { status:503 });
    return NextResponse.next();
  }
  const response = await getAuth0().middleware(request);
  if (replayTutorial) {
    response.cookies.set(TUTORIAL_REPLAY_COOKIE, '1', { path:'/', maxAge:600, sameSite:'lax' });
  }
  return response;
}
export const config = { matcher:['/((?!_next/static|_next/image|game/|favicon.ico|sitemap.xml|robots.txt).*)'] };
