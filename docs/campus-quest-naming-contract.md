# Campus Quest — Naming Contract
**Backend owner:** you | DB service: `campusquest-core` (TigerData/Postgres)

Everyone builds against these exact names. If someone needs a new field/function, they ask the backend owner to add it to this doc — nobody invents their own names on the fly, or Daniel's world and Hanmi's quest page will silently disagree with each other.

---

## 1. Core Data Model (Postgres tables)

### `users`
| field | type | notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | |
| `university` | text | e.g. `"Texas Tech University"` |
| `major` | text | |
| `level` | int | derived from `xp`, fixed curve |
| `xp` | int | |
| `coins` | int | |
| `character` | jsonb | avatar/character customization blob |
| `stats` | jsonb | `{ knowledge, wellness, community, career }` — all int, start at 0 |
| `owned_items` | — | *not* a column — derived from `user_items` table (see below) |

### `quests`
| field | type | notes |
|---|---|---|
| `id` | uuid | |
| `title` | text | e.g. `"Scholar's Journey"` |
| `description` | text | |
| `category` | enum | `SCHOLAR` \| `WELLNESS` \| `COMMUNITY` \| `CAREER` |
| `xp_reward` | int | |
| `coin_reward` | int | |
| `location_code` | text \| null | ties quest to a QR location (see §4) |
| `frequency` | enum | `DAILY` \| `ONE_TIME` \| `REPEATABLE` |

Category → stat mapping (this is what bumps the profile stats):
- `SCHOLAR` → `stats.knowledge`
- `WELLNESS` → `stats.wellness`
- `COMMUNITY` → `stats.community`
- `CAREER` → `stats.career`

### `quest_events` (time-series log — this is the TigerData-native table)
| field | type | notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | |
| `quest_id` | uuid | |
| `xp_gained` | int | |
| `coins_gained` | int | |
| `verified_by` | enum | `QR` \| `PHOTO_AI` \| `MANUAL` |
| `completed_at` | timestamptz | this is the time-series column |

This table is what powers weekly leaderboards/streaks — never overwrite it, only append.

### `items` (placeable world objects)
| field | type | notes |
|---|---|---|
| `id` | text | short slug, see §5 for the canonical 8–12 |
| `name` | text | |
| `cost` | int | coins |
| `category` | enum | `BUILDING` \| `DECOR` |

### `user_items` (ownership + placement)
| field | type | notes |
|---|---|---|
| `user_id` | uuid | |
| `item_id` | text | |
| `x` | int | grid position |
| `y` | int | grid position |
| `placed` | bool | owned but not placed = `false` |

### `friendships`
| field | type | notes |
|---|---|---|
| `user_id` | uuid | |
| `friend_id` | uuid | |
| `status` | enum | `PENDING` \| `ACCEPTED` |

---

## 2. Shared API functions (what everyone calls)

```ts
completeQuest(userId, questId, verifiedBy) 
// → { success, xpGained, coinsGained, leveledUp, newLevel, newXp, newCoins, updatedStats }

completeQuestByLocation(userId, locationCode)
// → same shape as completeQuest — this is what Victor's QR scanner calls.
// Backend resolves locationCode → today's matching quest → calls completeQuest internally.

purchaseItem(userId, itemId)
// → { success, newCoinBalance, ownedItems }

getPlayerProfile(userId)
// → { id, name, university, major, level, xp, coins, character, stats }

getPlayerWorld(userId)
// → { userId, placedItems: [{ itemId, x, y }] }
// THIS is the exact payload shape <GameWorld userId={userId} /> consumes —
// same shape whether userId is "me" or a friend. That's what makes
// "Visit Friend's World" free — no separate endpoint needed.

getLeaderboard(university, scope)
// scope: "ALL_TIME" | "WEEKLY" | "FRIENDS"
// → [{ userId, name, level, xp, rank }]

searchPlayers(query)
// → [{ userId, name, university, level }]

addFriend(userId, targetUserId)
// → { success, status }
```

---

## 3. Shared component contract (Daniel)

```tsx
<GameWorld userId={userId} readOnly={boolean} />
```
- `readOnly = false` → owner viewing their own world, build mode enabled
- `readOnly = true` → viewing a friend's world, build UI hidden
- Internally always fetches via `getPlayerWorld(userId)` — same component, any user.

---

## 4. QR verification — location codes (Hanmi)

QR codes encode **one of these exact strings**, nothing fancier:

```
LIBRARY
REC_CENTER
CAREER_CENTER
STUDENT_UNION
HACKATHON
```

Scan flow: QR → `completeQuestByLocation(userId, locationCode)` → backend finds today's active quest whose `location_code` matches → runs the normal `completeQuest` pipeline (XP → coins → level-up check → stat update → save).

---

## 5. Canonical placeable items (Hanmi — 8–12 to start)

| `id` | name | category | suggested cost |
|---|---|---|---|
| `house` | House | BUILDING | 0 (starter, free) |
| `tree` | Tree | DECOR | 50 |
| `library` | Library | BUILDING | 300 |
| `gym` | Gym | BUILDING | 300 |
| `fountain` | Fountain | DECOR | 150 |
| `garden` | Garden | DECOR | 100 |
| `trophy_building` | Trophy Building | BUILDING | 500 |
| `bench` | Bench | DECOR | 40 |
| `lamp_post` | Lamp Post | DECOR | 30 |
| `pond` | Pond | DECOR | 120 |

Keep `id` values exactly as-is — they're the primary key in `items` and what `user_items.item_id` references.

---

## 6. Leveling curve (fixed, as agreed)

```
xp_needed_for_level(n) = 100 * n
```
i.e. level 1→2 needs 100 xp, level 2→3 needs 200 more (300 total), etc. `completeQuest` checks cumulative `xp` against this after every award and increments `level` when crossed — can cross multiple levels in one quest if XP reward is large.

---

## 7. Auth (Emmanuel)

- Real eRaider SSO is out of scope for the hackathon — build a **convincing university-login UI** (university picker → "TTU login" screen) that, behind the scenes, calls your own auth (Auth0-based) and creates/loads a `users` row keyed by `id` (uuid).
- Every other function in this doc takes `userId` as a plain uuid string — that's the only thing Emmanuel's auth layer needs to hand off to the rest of the app.
