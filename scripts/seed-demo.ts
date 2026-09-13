import { transaction, db } from '../lib/db';
import { levelForXp } from '../lib/game-rules';

const university = 'Texas Tech University';
const demoSubjects = ['demo|maya-rodriguez', 'demo|jordan-lee', 'demo|victor-showcase'];

type DemoPlayer = {
  id: string;
  subject: string;
  name: string;
  major: string;
  xp: number;
  coins: number;
  stats: Record<string, number>;
  items: { itemId: string; x: number; y: number }[];
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
];

function level(xp: number) {
  return levelForXp(xp);
}

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
    await client.query(
      `UPDATE users
       SET university=$2,
           major=COALESCE(major,'Computer Science'),
           xp=GREATEST(xp,780),
           coins=GREATEST(coins,1500),
           level=GREATEST(level,$3),
           stats='{"knowledge":72,"wellness":54,"community":63,"career":41}'::jsonb,
           character=jsonb_build_object('sprite','student-shoes')
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'{"sprite":"student"}'::jsonb)
       ON CONFLICT (auth_subject) DO UPDATE SET
         name=EXCLUDED.name,
         university=EXCLUDED.university,
         major=EXCLUDED.major,
         level=EXCLUDED.level,
         xp=EXCLUDED.xp,
         coins=EXCLUDED.coins,
         stats=EXCLUDED.stats`,
      [player.id, player.subject, player.name, university, player.major, level(player.xp), player.xp, player.coins, player.stats],
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
  ).rows as { id: string; xp_reward: number; coin_reward: number; verification_policy: 'QR' | 'PHOTO_AI' | 'MANUAL' }[];

  for (const [index, quest] of questRows.entries()) {
    for (const userId of [showcase.id, demos[0].id, demos[1].id]) {
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

  console.log(`Seeded showcase data for ${showcase.name}, Maya Rodriguez, and Jordan Lee.`);
});

await db().end();
