import { db, transaction } from './db';
import { invariant } from './errors';
import { gridSize, Placements } from './game-rules';
import type { PlayerProfile, World, OwnedItem, PurchaseResult, LeaderboardEntry, PlayerSearchResult } from '../types/api';

const profileColumns = 'id, name, university, major, level, xp, coins, character, stats';
export async function getPlayerProfile(userId: string): Promise<PlayerProfile> {
  const result = await db().query(`SELECT ${profileColumns} FROM users WHERE id=$1`, [userId]);
  invariant(result.rowCount, 404, 'PLAYER_NOT_FOUND', 'Player not found.');
  return result.rows[0];
}
export async function ensurePlayer(subject: string, name: string): Promise<PlayerProfile> {
  return transaction(async client => {
    const { rows } = await client.query(`INSERT INTO users (auth_subject,name,university) VALUES ($1,$2,'Texas Tech University')
      ON CONFLICT (auth_subject) DO UPDATE SET auth_subject=EXCLUDED.auth_subject RETURNING ${profileColumns}`, [subject, name.slice(0,100)]);
    await client.query("INSERT INTO user_items (user_id,item_id) VALUES ($1,'house') ON CONFLICT DO NOTHING", [rows[0].id]);
    return rows[0];
  });
}
export async function updateProfile(userId: string, input: { name: string; university: string; major: string | null; character: Record<string, unknown> }) {
  const { rows } = await db().query(`UPDATE users SET name=$2, university=$3, major=$4, character=$5 WHERE id=$1 RETURNING ${profileColumns}`,
    [userId, input.name, input.university, input.major, input.character]);
  return rows[0] as PlayerProfile;
}
export async function getInventory(userId: string): Promise<OwnedItem[]> {
  return (await db().query('SELECT item_id AS "itemId", placed, x, y FROM user_items WHERE user_id=$1 ORDER BY item_id', [userId])).rows;
}
export async function getPlayerWorld(userId: string): Promise<World> {
  await getPlayerProfile(userId);
  return { userId, placedItems: (await db().query('SELECT item_id AS "itemId", x, y FROM user_items WHERE user_id=$1 AND placed ORDER BY item_id', [userId])).rows };
}
export async function purchaseItem(userId: string, itemId: string): Promise<PurchaseResult> {
  return transaction(async client => {
    const user = (await client.query('SELECT coins FROM users WHERE id=$1 FOR UPDATE', [userId])).rows[0];
    invariant(user, 404, 'PLAYER_NOT_FOUND', 'Player not found.');
    const item = (await client.query('SELECT cost FROM items WHERE id=$1 FOR SHARE', [itemId])).rows[0];
    invariant(item, 404, 'ITEM_NOT_FOUND', 'Item not found.');
    const owned = await client.query('SELECT 1 FROM user_items WHERE user_id=$1 AND item_id=$2', [userId,itemId]);
    if (!owned.rowCount) {
      invariant(user.coins >= item.cost, 409, 'INSUFFICIENT_COINS', 'You need more coins for this item.');
      await client.query('UPDATE users SET coins=coins-$2 WHERE id=$1', [userId,item.cost]);
      await client.query('INSERT INTO user_items (user_id,item_id) VALUES ($1,$2)', [userId,itemId]);
      user.coins -= item.cost;
    }
    const inventory = await client.query('SELECT item_id AS "itemId", placed, x, y FROM user_items WHERE user_id=$1 ORDER BY item_id', [userId]);
    return { success: true, newCoinBalance: user.coins, ownedItems: inventory.rows };
  });
}
export async function savePlayerWorld(userId: string, input: World['placedItems']): Promise<World> {
  const placements = Placements.parse(input);
  const size = gridSize();
  invariant(placements.every(p => p.x < size && p.y < size), 400, 'OUT_OF_BOUNDS', `Positions must be within a ${size} by ${size} grid.`);
  invariant(new Set(placements.map(p => p.itemId)).size === placements.length, 400, 'DUPLICATE_ITEM', 'Each item can be placed once.');
  invariant(new Set(placements.map(p => `${p.x},${p.y}`)).size === placements.length, 400, 'POSITION_OCCUPIED', 'Two items cannot share a tile.');
  return transaction(async client => {
    const user = await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
    invariant(user.rowCount,404,'PLAYER_NOT_FOUND','Player not found.');
    const owned = (await client.query('SELECT item_id FROM user_items WHERE user_id=$1', [userId])).rows.map(r => r.item_id);
    invariant(placements.every(p => owned.includes(p.itemId)),403,'ITEM_NOT_OWNED','Only owned items can be placed.');
    await client.query('UPDATE user_items SET placed=false,x=NULL,y=NULL WHERE user_id=$1', [userId]);
    for (const p of placements) await client.query('UPDATE user_items SET placed=true,x=$3,y=$4 WHERE user_id=$1 AND item_id=$2', [userId,p.itemId,p.x,p.y]);
    return { userId, placedItems: placements };
  });
}
export async function getLeaderboard(university: string, scope: 'ALL_TIME'|'WEEKLY'|'FRIENDS', viewerId: string): Promise<LeaderboardEntry[]> {
  const { rows } = await db().query(`WITH scores AS (
    SELECT u.id, u.name, u.level,
      CASE WHEN $2='WEEKLY' THEN COALESCE((SELECT sum(e.xp_gained) FROM quest_events e WHERE e.user_id=u.id
        AND e.completed_at >= (date_trunc('week', now() AT TIME ZONE 'America/Chicago') AT TIME ZONE 'America/Chicago')),0)::integer ELSE u.xp END AS xp
    FROM users u WHERE u.university=$1 AND ($2 <> 'FRIENDS' OR u.id=$3 OR EXISTS (
      SELECT 1 FROM friendships f WHERE f.status='ACCEPTED' AND ((f.user_id=$3 AND f.friend_id=u.id) OR (f.friend_id=$3 AND f.user_id=u.id))
    ))) SELECT id AS "userId", name, level, xp, (rank() OVER (ORDER BY xp DESC))::integer AS rank FROM scores ORDER BY xp DESC,id LIMIT 100`, [university,scope,viewerId]);
  return rows;
}
export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  const pattern = query.replace(/[\\%_]/g, '\\$&');
  return (await db().query('SELECT id AS "userId",name,university,level FROM users WHERE name ILIKE $1 ORDER BY name,id LIMIT 20', [`%${pattern}%`])).rows;
}
export async function addFriend(userId: string, targetUserId: string) {
  invariant(userId !== targetUserId,400,'SELF_FRIEND','Choose another player.');
  return transaction(async client => {
    // Lock the same pair in UUID order for crossing invitations.
    const users = await client.query('SELECT id FROM users WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [[userId,targetUserId]]);
    invariant(users.rowCount === 2,404,'PLAYER_NOT_FOUND','Player not found.');
    const existing = (await client.query('SELECT user_id,status FROM friendships WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)', [userId,targetUserId])).rows[0];
    if (!existing) await client.query('INSERT INTO friendships (user_id,friend_id) VALUES ($1,$2)', [userId,targetUserId]);
    // Accept only through the recipient's explicit accept endpoint.
    return { success: true, status: existing?.status ?? 'PENDING' };
  });
}
export async function acceptFriend(userId: string, requesterId: string) {
  const result = await db().query("UPDATE friendships SET status='ACCEPTED' WHERE user_id=$1 AND friend_id=$2 RETURNING status", [requesterId,userId]);
  invariant(result.rowCount,404,'REQUEST_NOT_FOUND','Incoming request not found.');
  return { success: true, status: 'ACCEPTED' };
}
export async function getFriends(userId: string) {
  return (await db().query(`SELECT u.id AS "userId",u.name,u.university,u.level,f.status,
    CASE WHEN f.user_id=$1 THEN 'OUTGOING' ELSE 'INCOMING' END AS direction
    FROM friendships f JOIN users u ON u.id=CASE WHEN f.user_id=$1 THEN f.friend_id ELSE f.user_id END
    WHERE f.user_id=$1 OR f.friend_id=$1 ORDER BY u.name`, [userId])).rows;
}
