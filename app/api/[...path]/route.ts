import { z } from 'zod';
import { requirePlayer } from '@/lib/auth';
import { db } from '@/lib/db';
import { AppError, invariant } from '@/lib/errors';
import { ClientLocation, verificationBypassEnabled } from '@/lib/campus-locations';
import { UUID, ItemId, Scope, LocationCode, Placements, gridSize } from '@/lib/game-rules';
import { ClaimSocialQuestSchema, SaveCampusProgressSchema } from '@/lib/campus-progress';
import { readJson, requireSameOrigin, errorResponse, decodePhoto } from '@/lib/http';
import * as players from '@/lib/player-service';
import * as quests from '@/lib/quest-service';
import { verifyPhoto } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
type Context = { params: Promise<{ path: string[] }> };
const Profile = z.object({ name:z.string().trim().min(1).max(100),university:z.string().trim().min(1).max(100),major:z.string().trim().max(100).nullable(),character:z.record(z.string(),z.unknown()) }).strict();
const Photo = z.object({
  mimeType: z.enum(['image/jpeg','image/png','image/webp']),
  data: z.string().max(4194304),
  location: ClientLocation.optional(),
}).strict();

async function route(request: Request,context: Context) {
  try {
    const { path } = await context.params;
    const url = new URL(request.url);
    const method = request.method;
    if (method === 'GET' && path.join('/') === 'health') {
      await db().query('SELECT 1');
      return Response.json({ status:'ok',database:'connected' }, { headers:{ 'Cache-Control':'no-store' } });
    }
    if (method !== 'GET') requireSameOrigin(request);
    const viewer = await requirePlayer();
    let result: unknown;
    if (method === 'GET' && path.join('/') === 'me') result = viewer;
    else if (method === 'PUT' && path.join('/') === 'me') result = await players.updateProfile(viewer.id,Profile.parse(await readJson(request)));
    else if (method === 'GET' && path.join('/') === 'me/campus-progress') result = await players.getCampusProgress(viewer.id);
    else if (method === 'PUT' && path.join('/') === 'me/campus-progress') {
      result = await players.saveCampusProgress(viewer.id, SaveCampusProgressSchema.parse(await readJson(request)));
    }
    else if (method === 'POST' && path.join('/') === 'me/social-quests/claim') {
      const body = ClaimSocialQuestSchema.parse(await readJson(request));
      result = await players.claimSocialQuest(viewer.id, body.questId);
    }
    else if (method === 'POST' && path.join('/') === 'me/tutorial/reset-quest') {
      const body = z.object({ locationCode: LocationCode }).strict().parse(await readJson(request));
      result = await quests.resetQuestByLocation(viewer.id, body.locationCode);
    }
    else if (method === 'GET' && path.join('/') === 'quests') result = await quests.getQuests();
    else if (method === 'GET' && path.join('/') === 'items') result = (await db().query('SELECT id,name,category,cost FROM items ORDER BY cost,id')).rows;
    else if (method === 'GET' && path.join('/') === 'world-config') result = { gridSize:gridSize(),maxCopiesPerItem:1,footprint:{ width:1,height:1 } };
    else if (method === 'GET' && path.join('/') === 'leaderboard') result = await players.getLeaderboard(
      z.string().trim().min(1).max(100).parse(url.searchParams.get('university') ?? viewer.university),Scope.parse(url.searchParams.get('scope') ?? 'ALL_TIME'),viewer.id);
    else if (method === 'GET' && path.join('/') === 'players') result = await players.searchPlayers(z.string().trim().min(2).max(80).parse(url.searchParams.get('query')));
    else if (path[0] === 'players' && path.length >= 2) {
      const userId = UUID.parse(path[1]);
      const tail = path.slice(2);
      if (method !== 'GET' || tail[0] === 'inventory' || tail[0] === 'friends' || tail[0] === 'attempts' || tail[0] === 'quest-progress') invariant(userId === viewer.id,403,'FORBIDDEN','You can only change your own progress.');
      if (method === 'GET' && tail.length === 0) result = await players.getPlayerProfile(userId);
      else if (method === 'GET' && tail.join('/') === 'world') result = await players.getPlayerWorld(userId);
      else if (method === 'GET' && tail.join('/') === 'inventory') result = await players.getInventory(userId);
      else if (method === 'GET' && tail.join('/') === 'quest-progress') result = await quests.getQuestProgress(userId);
      else if (method === 'GET' && tail.join('/') === 'friends') result = await players.getFriends(userId);
      else if (method === 'GET' && tail.length === 2 && tail[0] === 'attempts') {
        const found = await db().query('SELECT id,quest_id AS "questId",status,started_at AS "startedAt",verification_result AS verification,result FROM quest_attempts WHERE id=$1 AND user_id=$2', [UUID.parse(tail[1]),userId]);
        invariant(found.rowCount,404,'ATTEMPT_NOT_FOUND','Quest attempt not found.'); result = found.rows[0];
      }
      else if (method === 'PUT' && tail.join('/') === 'world') result = await players.savePlayerWorld(userId,z.object({ placedItems:Placements }).strict().parse(await readJson(request)).placedItems);
      else if (method === 'POST' && tail.join('/') === 'purchases') result = await players.purchaseItem(userId,z.object({ itemId:ItemId }).strict().parse(await readJson(request)).itemId);
      else if (method === 'POST' && tail.join('/') === 'friends') result = await players.addFriend(userId,z.object({ targetUserId:UUID }).strict().parse(await readJson(request)).targetUserId);
      else if (method === 'POST' && tail.length === 3 && tail[0] === 'friends' && tail[2] === 'accept') result = await players.acceptFriend(userId,UUID.parse(tail[1]));
      else if (method === 'POST' && tail.join('/') === 'quests/by-location') {
        const body = z.object({ locationCode:LocationCode,attemptId:UUID.optional(),location:ClientLocation.optional() }).strict().parse(await readJson(request));
        result = await quests.completeQuestByLocation(userId,body.locationCode,body.attemptId,body.location);
      }
      else if (method === 'POST' && tail.length === 3 && tail[0] === 'quests' && tail[2] === 'attempts') result = await quests.startQuest(userId,UUID.parse(tail[1]));
      else if (method === 'POST' && tail.length === 3 && tail[0] === 'attempts' && tail[2] === 'submit') {
        const photo = Photo.parse(await readJson(request,4200000));
        result = await quests.submitPhoto(
          userId,
          UUID.parse(tail[1]),
          decodePhoto(photo.data, photo.mimeType, verificationBypassEnabled()),
          photo.mimeType,
          verifyPhoto,
          photo.location,
        );
      } else throw new AppError(404,'NOT_FOUND','API route not found.');
    } else throw new AppError(404,'NOT_FOUND','API route not found.');
    return Response.json(result,{ headers:{ 'Cache-Control':'no-store' } });
  } catch (error) { return errorResponse(error); }
}
export const GET = route;
export const POST = route;
export const PUT = route;
