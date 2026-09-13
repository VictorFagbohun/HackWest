import { randomUUID, createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { db, transaction } from './db';
import { invariant, AppError } from './errors';
import { categoryStat, levelForXp } from './game-rules';
import type { CompletionResult, Quest, QuestAttempt, Stats } from '../types/api';

type Attempt = {
  id: string; quest_id: string; user_id: string; status: string; started_at: Date;
  verified_by: string | null; result: CompletionResult | null;
};
export type Verification = { approved: boolean; reason: string };
export type PhotoVerifier = (quest: Quest, bytes: Buffer, mimeType: string) => Promise<Verification>;

export async function getQuests(): Promise<Quest[]> {
  return (await db().query('SELECT id,title,description,category,xp_reward,coin_reward,location_code,frequency,verification_policy,minimum_duration_seconds FROM quests ORDER BY title')).rows;
}
async function periodKey(client: PoolClient, quest: Quest, attemptId: string) {
  if (quest.frequency === 'ONE_TIME') return 'ONCE';
  if (quest.frequency === 'REPEATABLE') return attemptId;
  return (await client.query("SELECT to_char(now() AT TIME ZONE 'America/Chicago','YYYY-MM-DD') AS day")).rows[0].day as string;
}
async function lockedUser(client: PoolClient, userId: string) {
  const user = (await client.query('SELECT * FROM users WHERE id=$1 FOR UPDATE', [userId])).rows[0];
  invariant(user,404,'PLAYER_NOT_FOUND','Player not found.');
  return user;
}
export async function startQuest(userId: string, questId: string): Promise<QuestAttempt> {
  return transaction(async client => {
    await lockedUser(client,userId);
    const quest = (await client.query('SELECT * FROM quests WHERE id=$1', [questId])).rows[0] as Quest;
    invariant(quest,404,'QUEST_NOT_FOUND','Quest not found.');
    const key = await periodKey(client,quest,'');
    const previous = quest.frequency !== 'REPEATABLE'
      ? (await client.query(`SELECT a.* FROM quest_claims c JOIN quest_attempts a ON a.id=c.attempt_id
          WHERE c.user_id=$1 AND c.quest_id=$2 AND c.period_key=$3`, [userId,questId,key])).rows[0]
      : undefined;
    const active = previous ?? (await client.query("SELECT * FROM quest_attempts WHERE user_id=$1 AND quest_id=$2 AND status IN ('STARTED','VERIFYING','APPROVED')", [userId,questId])).rows[0];
    if (active) return toAttempt(active);
    const count = (await client.query("SELECT count(*)::integer AS count FROM quest_attempts WHERE user_id=$1 AND started_at > now()-interval '1 hour'", [userId])).rows[0].count;
    invariant(count < 30,429,'QUEST_RATE_LIMIT','Too many quest attempts. Try again later.');
    const attempt = (await client.query('INSERT INTO quest_attempts (user_id,quest_id) VALUES ($1,$2) RETURNING *', [userId,questId])).rows[0];
    return toAttempt(attempt);
  });
}
function toAttempt(attempt: Attempt): QuestAttempt {
  return { id: attempt.id, questId: attempt.quest_id, status: attempt.status, startedAt: attempt.started_at.toISOString() };
}

// Internal reward function: only an attempt approved by a server verifier can earn rewards.
export async function completeQuest(userId: string, attemptId: string): Promise<CompletionResult> {
  return transaction(async client => {
    const user = await lockedUser(client,userId);
    const attempt = (await client.query('SELECT * FROM quest_attempts WHERE id=$1 AND user_id=$2 FOR UPDATE', [attemptId,userId])).rows[0] as Attempt;
    invariant(attempt,404,'ATTEMPT_NOT_FOUND','Quest attempt not found.');
    if (attempt.status === 'COMPLETED' && attempt.result) return attempt.result;
    invariant(attempt.status === 'APPROVED',409,'NOT_VERIFIED','This attempt has not passed verification.');
    const quest = (await client.query('SELECT * FROM quests WHERE id=$1 FOR SHARE', [attempt.quest_id])).rows[0] as Quest;
    const period = await periodKey(client,quest,attempt.id);
    const claim = await client.query('INSERT INTO quest_claims (user_id,quest_id,period_key,attempt_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING attempt_id', [userId,quest.id,period,attempt.id]);
    invariant(claim.rowCount,409,'ALREADY_COMPLETED','This quest has already earned its reward for this period.');
    const xp = user.xp + quest.xp_reward;
    const coins = user.coins + quest.coin_reward;
    const level = levelForXp(xp);
    const stats = { ...user.stats } as Stats;
    const stat = categoryStat[quest.category];
    stats[stat] = (Number(stats[stat]) || 0) + 1;
    const result: CompletionResult = { success:true,xpGained:quest.xp_reward,coinsGained:quest.coin_reward,
      leveledUp:level>user.level,newLevel:level,newXp:xp,newCoins:coins,updatedStats:stats };
    await client.query('UPDATE users SET xp=$2,coins=$3,level=$4,stats=$5 WHERE id=$1', [userId,xp,coins,level,stats]);
    await client.query('INSERT INTO quest_events (user_id,quest_id,xp_gained,coins_gained,verified_by,attempt_id) VALUES ($1,$2,$3,$4,$5,$6)', [userId,quest.id,quest.xp_reward,quest.coin_reward,attempt.verified_by,attempt.id]);
    await client.query("UPDATE quest_attempts SET status='COMPLETED',result=$2 WHERE id=$1", [attempt.id,result]);
    return result;
  });
}
export async function completeQuestByLocation(userId: string, locationCode: string, attemptId?: string): Promise<CompletionResult> {
  const quests = (await db().query("SELECT id,frequency FROM quests WHERE location_code=$1 AND verification_policy='QR' ORDER BY id LIMIT 2", [locationCode])).rows;
  invariant(quests.length,404,'LOCATION_NOT_FOUND','No QR quest exists for this location.');
  invariant(quests.length === 1,409,'AMBIGUOUS_LOCATION','Multiple quests match this location.');
  invariant(quests[0].frequency !== 'REPEATABLE' || attemptId,400,'ATTEMPT_REQUIRED','Start a repeatable quest first and submit its attempt ID.');
  const attempt = attemptId ? { id:attemptId } : await startQuest(userId,quests[0].id);
  await transaction(async client => {
    await lockedUser(client,userId);
    const row = (await client.query('SELECT a.status, q.verification_policy, q.minimum_duration_seconds, EXTRACT(EPOCH FROM now()-a.started_at) AS elapsed FROM quest_attempts a JOIN quests q ON q.id=a.quest_id WHERE a.id=$1 AND a.user_id=$2 AND a.quest_id=$3 FOR UPDATE OF a', [attempt.id,userId,quests[0].id])).rows[0];
    invariant(row,404,'ATTEMPT_NOT_FOUND','Quest attempt not found for this location.');
    if (row.status === 'COMPLETED') return;
    invariant(row.verification_policy === 'QR',409,'WRONG_VERIFICATION','This quest does not accept QR verification.');
    invariant(Number(row.elapsed) >= row.minimum_duration_seconds,409,'TOO_EARLY','The quest timer is still running.');
    invariant(row.status === 'STARTED' || row.status === 'APPROVED',409,'ATTEMPT_BUSY','Attempt cannot be completed now.');
    await client.query("UPDATE quest_attempts SET status='APPROVED',verified_by='QR',verification_result=$2 WHERE id=$1", [attempt.id,{ approved:true,reason:'Demo location code matched.' }]);
  });
  return completeQuest(userId,attempt.id);
}

export async function submitPhoto(userId: string, attemptId: string, bytes: Buffer, mimeType: string, verify: PhotoVerifier): Promise<CompletionResult> {
  const token = randomUUID();
  const digest = createHash('sha256').update(bytes).digest('hex');
  const reserved = await transaction(async client => {
    await lockedUser(client,userId);
    const a = (await client.query('SELECT *, EXTRACT(EPOCH FROM now()-started_at) AS elapsed, verification_started_at < now()-interval \'90 seconds\' AS stale FROM quest_attempts WHERE id=$1 AND user_id=$2 FOR UPDATE', [attemptId,userId])).rows[0];
    invariant(a,404,'ATTEMPT_NOT_FOUND','Quest attempt not found.');
    if (a.status === 'COMPLETED') return { result:a.result as CompletionResult };
    const quest = (await client.query('SELECT * FROM quests WHERE id=$1', [a.quest_id])).rows[0] as Quest;
    invariant(quest.verification_policy === 'PHOTO_AI',409,'WRONG_VERIFICATION','This quest does not accept photos.');
    if (a.status === 'APPROVED') return { approved:true };
    invariant(a.status === 'STARTED' || (a.status === 'VERIFYING' && a.stale),409,'ATTEMPT_BUSY','This attempt is already processing or was rejected.');
    invariant(Number(a.elapsed) >= quest.minimum_duration_seconds,409,'TOO_EARLY','The quest timer is still running.');
    const calls = (await client.query("SELECT COALESCE(sum(verification_calls),0)::integer AS count FROM quest_attempts WHERE user_id=$1 AND verification_started_at > now()-interval '1 hour'", [userId])).rows[0].count;
    invariant(calls < 10,429,'PHOTO_RATE_LIMIT','Photo verification limit reached. Try again later.');
    const duplicate = await client.query('SELECT 1 FROM quest_attempts WHERE user_id=$1 AND evidence_hash=$2 AND id<>$3', [userId,digest,attemptId]);
    invariant(!duplicate.rowCount,409,'PHOTO_REUSED','This photo was already submitted for another attempt.');
    await client.query("UPDATE quest_attempts SET status='VERIFYING',verification_token=$2,verification_started_at=now(),verification_calls=verification_calls+1,evidence_hash=$3 WHERE id=$1", [attemptId,token,digest]);
    return { quest };
  });
  if (reserved.result) return reserved.result;
  if (reserved.approved) return completeQuest(userId,attemptId);
  let verification: Verification;
  try { verification = await verify(reserved.quest!,bytes,mimeType); }
  catch {
    await db().query("UPDATE quest_attempts SET status='STARTED',verification_token=NULL WHERE id=$1 AND verification_token=$2 AND status='VERIFYING'", [attemptId,token]);
    throw new AppError(503,'VERIFICATION_UNAVAILABLE','Photo verification is unavailable. Your attempt is saved; try again later.');
  }
  const saved = await db().query("UPDATE quest_attempts SET status=$3,verified_by='PHOTO_AI',verification_result=$4,verification_token=NULL WHERE id=$1 AND verification_token=$2 AND status='VERIFYING' RETURNING id",
    [attemptId,token,verification.approved?'APPROVED':'REJECTED',verification]);
  invariant(saved.rowCount,409,'VERIFICATION_EXPIRED','A newer verification request replaced this one.');
  invariant(verification.approved,422,'PHOTO_REJECTED',verification.reason);
  return completeQuest(userId,attemptId);
}
