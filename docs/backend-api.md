# Backend handoff

This is the implemented supplement to [the original naming contract](campus-quest-naming-contract.md). Existing profile/world/reward response fields, catalog IDs, categories and QR location codes are preserved.

## Important changes for teammates

1. `getMe()` provides the authenticated player's application UUID. Never use the Auth0 subject as the player UUID.
2. `completeQuest(userId, attemptId, evidence)` replaces the proposed `completeQuest(userId, questId, verifiedBy)`. Start a photo quest to get the attempt ID, then submit evidence. Callers cannot assert that verification passed.
3. `completeQuestByLocation(userId, locationCode, attemptId?)` preserves the original two-argument use for the seeded daily/one-time QR quests. Repeatable or timed QR quests should start an attempt first; repeatable quests must submit its ID.
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
| POST | `/players/:id/purchases` | `{ itemId }` → `{ success, newCoinBalance, ownedItems }` |
| POST | `/players/:id/quests/:questId/attempts` | No body → `{ id, questId, status, startedAt }` |
| POST | `/players/:id/quests/by-location` | `{ locationCode, attemptId? }` → completion receipt |
| POST | `/players/:id/attempts/:attemptId/submit` | `{ mimeType, data }` → completion receipt |
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
import { getMe, startQuest, completeQuest, completeQuestByLocation } from '@/lib/api';

const me = await getMe();
const reward = await completeQuestByLocation(me.id, 'LIBRARY');
// reward: { success, xpGained, coinsGained, leveledUp, newLevel,
//           newXp, newCoins, updatedStats }

// At the start of the photo activity:
const attempt = await startQuest(me.id, photoQuest.id);
// Persist attempt.id in component/local storage state for reload recovery.
// At the end, FileReader.readAsDataURL(file), then remove the data URL prefix:
const receipt = await completeQuest(me.id, attempt.id, {
  mimeType: 'image/jpeg', data: base64WithoutPrefix,
});
```

`getQuests()` includes `verification_policy` and `minimum_duration_seconds` so the UI can choose QR/photo controls and display the timer. `startedAt` is the server start time. The server enforces duration even if the browser timer is altered. Static QR codes are demo location checks, not proof of physical presence.

## World example

```ts
import { getMe, purchaseItem, getPlayerWorld, savePlayerWorld } from '@/lib/api';
const me = await getMe();
await purchaseItem(me.id, 'tree');
const world = await getPlayerWorld(me.id);
await savePlayerWorld(me.id, [...world.placedItems, { itemId: 'tree', x: 4, y: 5 }]);
```

Purchasing an already-owned item returns the current inventory without charging again. Omit an item from `placedItems` to put it back into inventory. Invalid ownership, duplicate tiles, duplicate items, and out-of-bounds positions reject the whole save.
