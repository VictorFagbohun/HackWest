import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { db } from '../../lib/db';
import * as players from '../../lib/player-service';
import * as quests from '../../lib/quest-service';

test('backend integration against an isolated disposable schema', { timeout:180000 }, async t => {
  assert.ok(process.env.DATABASE_URL,'DATABASE_URL required');
  const original = process.env.DATABASE_URL;
  const admin = new Pool({ connectionString:original,max:1,connectionTimeoutMillis:10000 });
  const schema = `cq_test_${randomUUID().replaceAll('-','')}`;
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const url = new URL(original);
  url.searchParams.set('options',`-c search_path=${schema},public`);
  process.env.DATABASE_URL = url.toString();
  try {
    for (const file of ['001_core.sql','002_integrity.sql','003_quest_hypertable.sql']) {
      const sql = await readFile(`db/migrations/${file}`,'utf8');
      try { await db().query(sql); } catch (error) {
        const position = Number((error as { position?:string }).position);
        console.error('Migration failed:',file,'near',sql.slice(Math.max(0,position-70),position+70));
        throw error;
      }
    }
    const a = await players.ensurePlayer(`test|${randomUUID()}`,'Quest Tester');
    const b = await players.ensurePlayer(`test|${randomUUID()}`,'Friend Tester');
    await t.test('identity mapping and starter house are idempotent', async () => {
      const subject = (await db().query('SELECT auth_subject FROM users WHERE id=$1',[a.id])).rows[0].auth_subject;
      assert.equal((await players.ensurePlayer(subject,'Ignored')).id,a.id);
      assert.deepEqual((await players.getInventory(a.id)).map(i => i.itemId),['house']);
    });
    await t.test('concurrent QR completion pays exactly once and crosses a level', async () => {
      const results = await Promise.all(Array.from({ length:6 },() => quests.completeQuestByLocation(a.id,'LIBRARY')));
      assert.ok(results.every(r => r.newXp === 100));
      const profile = await players.getPlayerProfile(a.id);
      assert.equal(profile.xp,100); assert.equal(profile.coins,50); assert.equal(profile.level,2); assert.equal(profile.stats.knowledge,1);
      assert.equal((await db().query('SELECT count(*)::integer AS n FROM quest_events WHERE user_id=$1',[a.id])).rows[0].n,1);
    });
    await t.test('concurrent purchases cannot overspend and retries do not charge twice', async () => {
      const outcomes = await Promise.allSettled([players.purchaseItem(a.id,'bench'),players.purchaseItem(a.id,'lamp_post')]);
      assert.equal(outcomes.filter(o => o.status === 'fulfilled').length,1);
      const owned = (await players.getInventory(a.id)).find(i => i.itemId !== 'house')!;
      const balance = (await players.getPlayerProfile(a.id)).coins;
      await players.purchaseItem(a.id,owned.itemId);
      assert.equal((await players.getPlayerProfile(a.id)).coins,balance);
      assert.ok(balance >= 0);
    });
    await t.test('world ownership, collisions, bounds and transactional rollback', async () => {
      await players.savePlayerWorld(a.id,[{ itemId:'house',x:1,y:2 }]);
      await assert.rejects(players.savePlayerWorld(a.id,[{ itemId:'gym',x:2,y:2 }]), /owned/);
      await assert.rejects(players.savePlayerWorld(a.id,[{ itemId:'house',x:200,y:0 }]), /grid/);
      const other = (await players.getInventory(a.id)).find(i => i.itemId !== 'house')!;
      await assert.rejects(players.savePlayerWorld(a.id,[{ itemId:'house',x:1,y:1 },{ itemId:other.itemId,x:1,y:1 }]), /share a tile/);
      assert.deepEqual((await players.getPlayerWorld(a.id)).placedItems,[{ itemId:'house',x:1,y:2 }]);
    });
    await t.test('unverified and another player attempts cannot earn rewards', async () => {
      const photo = (await quests.getQuests()).find(q => q.verification_policy === 'PHOTO_AI')!;
      const attempt = await quests.startQuest(a.id,photo.id);
      await assert.rejects(quests.completeQuest(a.id,attempt.id), /verification/);
      await assert.rejects(quests.completeQuest(b.id,attempt.id), /not found/);
      await assert.rejects(quests.submitPhoto(a.id,attempt.id,Buffer.from('timer'),'image/jpeg',async () => ({ approved:true,reason:'Test verifier' })), /timer/);
      // Backdate only this disposable test attempt; production duration checks remain enabled.
      await db().query("UPDATE quest_attempts SET started_at=now()-interval '61 minutes' WHERE id=$1",[attempt.id]);
      await assert.rejects(quests.submitPhoto(a.id,attempt.id,Buffer.from('outage'),'image/jpeg',async () => { throw new Error('Simulated provider outage'); }), /unavailable/);
      assert.equal((await db().query('SELECT status FROM quest_attempts WHERE id=$1',[attempt.id])).rows[0].status,'STARTED');
      const before = (await players.getPlayerProfile(a.id)).xp;
      const result = await quests.submitPhoto(a.id,attempt.id,Buffer.from('accepted'),'image/jpeg',async () => ({ approved:true,reason:'Test evidence' }));
      assert.equal(result.newXp,before+100);
      assert.deepEqual(await quests.completeQuest(a.id,attempt.id),result);
    });
    await t.test('rejected photos award nothing', async () => {
      const photo = (await quests.getQuests()).find(q => q.verification_policy === 'PHOTO_AI')!;
      const attempt = await quests.startQuest(b.id,photo.id);
      await db().query("UPDATE quest_attempts SET started_at=now()-interval '61 minutes' WHERE id=$1",[attempt.id]);
      await assert.rejects(quests.submitPhoto(b.id,attempt.id,Buffer.from('rejected'),'image/jpeg',async () => ({ approved:false,reason:'Wrong location' })), /Wrong location/);
      assert.equal((await players.getPlayerProfile(b.id)).xp,0);
      assert.equal((await db().query('SELECT status FROM quest_attempts WHERE id=$1',[attempt.id])).rows[0].status,'REJECTED');
    });
    await t.test('failed event insertion rolls back both balances and claim', async () => {
      const q = (await quests.getQuests()).find(q => q.location_code === 'CAREER_CENTER')!;
      const attempt = await quests.startQuest(b.id,q.id);
      await db().query("UPDATE quest_attempts SET status='APPROVED',verified_by='MANUAL' WHERE id=$1",[attempt.id]);
      // Force a genuine downstream SQL failure without modifying production tables.
      await db().query(`CREATE FUNCTION fail_test_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'intentional test failure'; END; $$;
        CREATE TRIGGER fail_test_event BEFORE INSERT ON quest_events FOR EACH ROW EXECUTE FUNCTION fail_test_event()`);
      await assert.rejects(quests.completeQuest(b.id,attempt.id), /intentional test failure/);
      await db().query('DROP TRIGGER fail_test_event ON quest_events');
      assert.equal((await players.getPlayerProfile(b.id)).xp,0);
      assert.equal((await db().query('SELECT count(*)::integer AS n FROM quest_claims WHERE attempt_id=$1',[attempt.id])).rows[0].n,0);
    });
    await t.test('crossing friend requests stay pending until recipient accepts', async () => {
      await Promise.all([players.addFriend(a.id,b.id),players.addFriend(b.id,a.id)]);
      const { rows } = await db().query('SELECT * FROM friendships');
      assert.equal(rows.length,1); assert.equal(rows[0].status,'PENDING');
      await assert.rejects(players.acceptFriend(rows[0].user_id,rows[0].friend_id), /not found/);
      await players.acceptFriend(rows[0].friend_id,rows[0].user_id);
      assert.equal((await players.getFriends(a.id))[0].status,'ACCEPTED');
      const leaders = await players.getLeaderboard('Texas Tech University','FRIENDS',a.id);
      assert.equal(leaders.length,2); assert.equal(leaders[0].userId,a.id);
    });
    await t.test('weekly ranking sums events and quest log is a hypertable', async () => {
      const leaders = await players.getLeaderboard('Texas Tech University','WEEKLY',a.id);
      assert.equal(leaders[0].xp,200);
      assert.equal((await db().query('SELECT count(*)::integer AS n FROM timescaledb_information.hypertables WHERE hypertable_schema=$1 AND hypertable_name=$2',[schema,'quest_events'])).rows[0].n,1);
    });
    await t.test('daily reset, one-time claims, repeatable attempt retries and reused photos', async () => {
      const c = await players.ensurePlayer(`test|${randomUUID()}`,'Frequency Tester');
      await db().query("UPDATE users SET university='Test Campus' WHERE id=$1",[c.id]);
      await quests.completeQuestByLocation(c.id,'LIBRARY');
      await db().query("UPDATE quest_claims SET period_key='2000-01-01' WHERE user_id=$1",[c.id]);
      await quests.completeQuestByLocation(c.id,'LIBRARY');
      assert.equal((await players.getPlayerProfile(c.id)).xp,200);
      await quests.completeQuestByLocation(c.id,'HACKATHON');
      await quests.completeQuestByLocation(c.id,'HACKATHON');
      assert.equal((await players.getPlayerProfile(c.id)).xp,400);
      await db().query("UPDATE quests SET frequency='REPEATABLE' WHERE location_code='REC_CENTER'");
      await assert.rejects(quests.completeQuestByLocation(c.id,'REC_CENTER'),/attempt ID/);
      const qr = (await quests.getQuests()).find(q => q.location_code === 'REC_CENTER')!;
      const first = await quests.startQuest(c.id,qr.id);
      await Promise.all([quests.completeQuestByLocation(c.id,'REC_CENTER',first.id),quests.completeQuestByLocation(c.id,'REC_CENTER',first.id)]);
      assert.equal((await players.getPlayerProfile(c.id)).xp,475);
      const second = await quests.startQuest(c.id,qr.id);
      assert.notEqual(first.id,second.id);
      await quests.completeQuestByLocation(c.id,'REC_CENTER',second.id);
      assert.equal((await players.getPlayerProfile(c.id)).xp,550);
      const photo = (await quests.getQuests()).find(q => q.verification_policy === 'PHOTO_AI')!;
      const photoAttempt = await quests.startQuest(b.id,photo.id);
      await db().query("UPDATE quest_attempts SET started_at=now()-interval '61 minutes' WHERE id=$1",[photoAttempt.id]);
      await assert.rejects(quests.submitPhoto(b.id,photoAttempt.id,Buffer.from('rejected'),'image/jpeg',async () => ({ approved:true,reason:'Should not run' })),/already submitted/);
    });
  } finally {
    await db().end();
    // This identifier is generated above with a fixed prefix and UUID, never supplied by a user.
    assert.match(schema,/^cq_test_[a-f0-9]{32}$/);
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end(); process.env.DATABASE_URL = original;
  }
});
