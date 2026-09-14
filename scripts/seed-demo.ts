import { readFileSync, existsSync } from 'node:fs';
import { transaction, db } from '../lib/db';
import { levelForXp } from '../lib/game-rules';
import { createVictorWorld } from '../lib/social-data';
import type { WorldData } from '../types/world';

function loadEnvLocal() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

const university = 'Texas Tech University';
const demoSubjects = [
  'demo|maya-rodriguez',
  'demo|jordan-lee',
  'demo|victor-fagbohun',
  'demo|victor-showcase',
];

type DemoPlayer = {
  id: string;
  subject: string;
  name: string;
  major: string;
  xp: number;
  coins: number;
  stats: Record<string, number>;
  items: { itemId: string; x: number; y: number }[];
  homeWorld?: WorldData;
};

const demos: DemoPlayer[] = [
  {
    id: '10000000-0000-0000-0000-000000000101',
    subject: 'demo|maya-rodriguez',
    name: 'Maya Rodriguez',
    major: 'Biology',
    xp: 1680,
    coins: 940,
    stats: { knowledge: 76, wellness: 88, community: 61, career: 43 },
    items: [
      { itemId: 'house', x: 5, y: 6 },
      { itemId: 'gym', x: 8, y: 6 },
      { itemId: 'tree', x: 4, y: 8 },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000102',
    subject: 'demo|jordan-lee',
    name: 'Jordan Lee',
    major: 'Architecture',
    xp: 1435,
    coins: 720,
    stats: { knowledge: 64, wellness: 51, community: 72, career: 69 },
    items: [
      { itemId: 'house', x: 5, y: 6 },
      { itemId: 'library', x: 7, y: 6 },
      { itemId: 'bench', x: 6, y: 8 },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000201',
    subject: 'demo|victor-fagbohun',
    name: 'Victor Fagbohun',
    major: 'Computer Science',
    xp: 2140,
    coins: 1880,
    stats: { knowledge: 88, wellness: 74, community: 81, career: 79 },
    items: [
      { itemId: 'house', x: 5, y: 6 },
      { itemId: 'library', x: 8, y: 6 },
      { itemId: 'gym', x: 5, y: 9 },
      { itemId: 'trophy_building', x: 8, y: 9 },
      { itemId: 'fountain', x: 6, y: 8 },
      { itemId: 'bench', x: 7, y: 11 },
      { itemId: 'tree', x: 4, y: 8 },
      { itemId: 'lamp_post', x: 9, y: 8 },
      { itemId: 'garden', x: 3, y: 10 },
      { itemId: 'pond', x: 10, y: 10 },
    ],
    homeWorld: createVictorWorld(),
  },
];

function level(xp: number) {
  return levelForXp(xp);
}

function characterPayload(player: DemoPlayer) {
  const campusProgress = {
    claimedQuestIds: [],
    visitedFriendIds: [],
    homeWorld: player.homeWorld ?? null,
  };
  return {
    sprite: 'student',
    campusProgress,
  };
}

async function main() {
  await transaction(async (client) => {
  let showcase: { id: string; name: string } | undefined = (
    await client.query(
      `SELECT id, name FROM users
       WHERE COALESCE(auth_subject,'') <> ALL($1::text[])
       ORDER BY created_at DESC
       LIMIT 1`,
      [demoSubjects],
    )
  ).rows[0] as { id: string; name: string } | undefined;

  if (!showcase) {
    showcase = (
      await client.query(
        `INSERT INTO users (id, auth_subject, name, university, major, level, xp, coins, stats, character)
         VALUES ('10000000-0000-0000-0000-000000000103','demo|victor-showcase','Victor Demo',$1,'Computer Science',4,780,1500,
           '{"knowledge":72,"wellness":54,"community":63,"career":41}'::jsonb,
           '{"sprite":"student-shoes"}'::jsonb)
         ON CONFLICT (auth_subject) DO UPDATE SET name=EXCLUDED.name
         RETURNING id, name`,
        [university],
      )
    ).rows[0];
  } else {
    // Preserve existing campusProgress / outfit; only backfill basics.
    await client.query(
      `UPDATE users
       SET university=$2,
           major=COALESCE(major,'Computer Science'),
           xp=GREATEST(xp,780),
           coins=GREATEST(coins,1500),
           level=GREATEST(level,$3),
           stats=COALESCE(stats, '{"knowledge":72,"wellness":54,"community":63,"career":41}'::jsonb),
           character = COALESCE(character, '{}'::jsonb) || jsonb_build_object('sprite', COALESCE(character->>'sprite', 'student-shoes'))
       WHERE id=$1`,
      [showcase.id, university, level(780)],
    );
  }

  if (!showcase) {
    throw new Error('Could not create showcase player.');
  }

  for (const player of demos) {
    await client.query(
      `INSERT INTO users (id, auth_subject, name, university, major, level, xp, coins, stats, character)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       ON CONFLICT (auth_subject) DO UPDATE SET
         name=EXCLUDED.name,
         university=EXCLUDED.university,
         major=EXCLUDED.major,
         level=EXCLUDED.level,
         xp=EXCLUDED.xp,
         coins=EXCLUDED.coins,
         stats=EXCLUDED.stats,
         character=EXCLUDED.character`,
      [
        player.id,
        player.subject,
        player.name,
        university,
        player.major,
        level(player.xp),
        player.xp,
        player.coins,
        player.stats,
        JSON.stringify(characterPayload(player)),
      ],
    );

    await client.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1,$2,'ACCEPTED')
       ON CONFLICT ON CONSTRAINT friendships_pkey DO UPDATE SET status='ACCEPTED'`,
      [showcase.id, player.id],
    );

    await client.query('DELETE FROM user_items WHERE user_id=$1', [player.id]);
    for (const item of player.items) {
      await client.query(
        `INSERT INTO user_items (user_id, item_id, placed, x, y)
         VALUES ($1,$2,true,$3,$4)
         ON CONFLICT (user_id, item_id) DO UPDATE SET placed=true, x=EXCLUDED.x, y=EXCLUDED.y`,
        [player.id, item.itemId, item.x, item.y],
      );
    }
  }

  const questRows = (
    await client.query(
      `SELECT id, xp_reward, coin_reward, verification_policy
       FROM quests
       ORDER BY created_at, title
       LIMIT 4`,
    )
  ).rows as {
    id: string;
    xp_reward: number;
    coin_reward: number;
    verification_policy: 'QR' | 'PHOTO_AI' | 'MANUAL';
  }[];

  for (const [index, quest] of questRows.entries()) {
    for (const userId of [showcase.id, ...demos.map((d) => d.id)]) {
      await client.query(
        `INSERT INTO quest_events (user_id, quest_id, xp_gained, coins_gained, verified_by, completed_at)
         VALUES ($1,$2,$3,$4,$5, now() - ($6::int * interval '1 day'))`,
        [userId, quest.id, quest.xp_reward, quest.coin_reward, quest.verification_policy, index],
      );
    }
  }

  await client.query(
    `INSERT INTO user_items (user_id, item_id, placed, x, y)
     VALUES ($1,'house',true,5,6), ($1,'library',true,8,6), ($1,'lamp_post',true,6,8)
     ON CONFLICT (user_id, item_id) DO UPDATE SET placed=true, x=EXCLUDED.x, y=EXCLUDED.y`,
    [showcase.id],
  );

  console.log(
    `Seeded showcase data for ${showcase.name}, Maya Rodriguez, Jordan Lee, and Victor Fagbohun.`,
  );
  });

  await db().end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
