import 'server-only';
import { getAuth0 } from './auth0';
import { invariant } from './errors';
import { ensurePlayer } from './player-service';
export async function requirePlayer() {
  const session = await getAuth0().getSession();
  invariant(session?.user?.sub,401,'UNAUTHENTICATED','Sign in to continue.');
  return ensurePlayer(session.user.sub,session.user.name || session.user.nickname || 'Student');
}
