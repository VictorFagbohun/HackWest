# Backend handoff

This is the implemented supplement to [the original naming contract](campus-quest-naming-contract.md). Existing profile/world/reward response fields, catalog IDs, categories and location codes are preserved. Campus quests verify with **on-site GPS + Gemini photo**, not QR codes.

## Important changes for teammates

1. `getMe()` provides the authenticated player's application UUID. Never use the Auth0 subject as the player UUID.
2. `completeQuest(userId, attemptId, evidence)` replaces the proposed `completeQuest(userId, questId, verifiedBy)`. Start a photo quest to get the attempt ID, then submit photo evidence plus device GPS. Callers cannot assert that verification passed.
3. `completeQuestByLocation` is deprecated; seeded campus quests use `PHOTO_AI` with GPS + photo instead of QR check-ins.
4. `savePlayerWorld`, `getInventory`, `getItems`, `getWorldConfig`, `getFriends`, and `acceptFriend` complete the shop/map/friend workflows missing from the original contract.
5. `addFriend` sends an invitation; only the recipient may call `acceptFriend`. Crossing requests do not auto-accept.
6. All routes except health require a session. Writes compare the path's player UUID to that session and validate same-origin requests. The browser's `readOnly` prop is only a UI setting.

## Endpoints

| Method | Path under `/api` | Body / result |
|---|---|---|
| GET | `/health` | `{ status, database }` |
| GET | `/me` | `PlayerProfile` |
| PUT | `/me` | `{ name, university, major, character }` → profile |
| GET | `/quests` | `Quest[]` |
| GET | `/items` | `{ id, name, category, cost }[]` |
| GET | `/world-config` | `{ gridSize, maxCopiesPerItem, footprint }` |
| GET | `/players/:id` | `PlayerProfile` |
| GET | `/players/:id/world` | `{ userId, placedItems: [{ itemId, x, y }] }` |
| PUT | `/players/:id/world` | `{ placedItems }` → world; replaces all placements |
| GET | `/players/:id/inventory` | `[{ itemId, placed, x, y }]` |
| GET | `/players/:id/quest-progress` | Quest list plus `claimed` and `activeAttempt` for the viewer |
| POST | `/players/:id/purchases` | `{ itemId }` → `{ success, newCoinBalance, ownedItems }` |
| POST | `/players/:id/quests/:questId/attempts` | No body → `{ id, questId, status, startedAt }` |
| POST | `/players/:id/quests/by-location` | Deprecated QR path; prefer photo submit |
| POST | `/players/:id/attempts/:attemptId/submit` | `{ mimeType, data, location? }` → completion receipt |
| GET | `/players/:id/attempts/:attemptId` | Attempt plus `verification` and `result` |
| GET | `/leaderboard?university=...&scope=...` | `[{ userId, name, level, xp, rank }]` |
| GET | `/players?query=...` | `[{ userId, name, university, level }]` (max 20) |
| GET | `/players/:id/friends` | Player summaries plus `status`, `direction` |
| POST | `/players/:id/friends` | `{ targetUserId }` → `{ success, status }` |
| POST | `/players/:id/friends/:requesterId/accept` | No body → `{ success, status }` |

Leaderboard scopes are `ALL_TIME`, `WEEKLY`, `FRIENDS`. Friends scope ranks the viewer and accepted friends at the selected university using all-time XP. Weekly `xp` is earned XP this week; displayed level remains the player's current level. Ties share rank; IDs provide stable display ordering. Results are capped at 100.

All JSON bodies reject unknown top-level fields. Errors use `{ success: false, error: { code, message } }`. `ApiError` from `lib/api.ts` exposes HTTP `status` and `code`. Common codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `INSUFFICIENT_COINS` (409), `TOO_EARLY` (409), `ATTEMPT_BUSY` (409), `PHOTO_REUSED` (409), `PHOTO_REJECTED` (422), `PHOTO_RATE_LIMIT` (429), `VERIFICATION_UNAVAILABLE` (503).

## Quest page example

```ts
import { getMe, startQuest, completeQuest } from '@/lib/api';

const me = await getMe();
const attempt = await startQuest(me.id, photoQuest.id);
// Persist attempt.id for reload recovery. After the timer (if any),
// capture GPS + a photo on site:
const receipt = await completeQuest(me.id, attempt.id, {
  mimeType: 'image/jpeg',
  data: base64WithoutPrefix,
  location: { latitude, longitude, accuracyMeters },
});
```

`getQuests()` / `getQuestProgress()` include `verification_policy` and `minimum_duration_seconds`. `startedAt` is the server start time. The server enforces duration, GPS geofencing against campus pins, and Gemini scene checks. Set `GEO_CHECK_DISABLED=true` only for off-campus local demos.

## World example

```ts
import { getMe, purchaseItem, getPlayerWorld, savePlayerWorld } from '@/lib/api';
const me = await getMe();
await purchaseItem(me.id, 'tree');
const world = await getPlayerWorld(me.id);
await savePlayerWorld(me.id, [...world.placedItems, { itemId: 'tree', x: 4, y: 5 }]);
```

Purchasing an already-owned item returns the current inventory without charging again. Omit an item from `placedItems` to put it back into inventory. Invalid ownership, duplicate tiles, duplicate items, and out-of-bounds positions reject the whole save.
