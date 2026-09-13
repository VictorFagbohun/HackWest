// Browser-safe shared client. Never import db, auth, or service modules in components.
import type { CompletionResult, PlayerProfile, Quest, QuestAttempt, PurchaseResult, World, LeaderboardEntry, PlayerSearchResult, OwnedItem, ApiFailure } from '@/types/api';
export class ApiError extends Error {
  constructor(public status: number,public code: string,message: string) { super(message); }
}
async function call<T>(path: string,method='GET',body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`,{ method,credentials:'same-origin',cache:'no-store',
    ...(body === undefined ? {} : { headers:{ 'Content-Type':'application/json' },body:JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) {
    const failure = data as ApiFailure;
    throw new ApiError(response.status,failure.error?.code ?? 'REQUEST_FAILED',failure.error?.message ?? 'Request failed.');
  }
  return data as T;
}
const player = (userId: string) => `players/${encodeURIComponent(userId)}`;
export const getMe = () => call<PlayerProfile>('me');
export const updatePlayerProfile = (profile: Pick<PlayerProfile,'name'|'university'|'major'|'character'>) => call<PlayerProfile>('me','PUT',profile);
export const getQuests = () => call<Quest[]>('quests');
export const getItems = () => call<{ id:string;name:string;category:'BUILDING'|'DECOR';cost:number }[]>('items');
export const getPlayerProfile = (userId: string) => call<PlayerProfile>(player(userId));
export const getPlayerWorld = (userId: string) => call<World>(`${player(userId)}/world`);
export const getInventory = (userId: string) => call<OwnedItem[]>(`${player(userId)}/inventory`);
export const savePlayerWorld = (userId: string,placedItems: World['placedItems']) => call<World>(`${player(userId)}/world`,'PUT',{ placedItems });
export const purchaseItem = (userId: string,itemId: string) => call<PurchaseResult>(`${player(userId)}/purchases`,'POST',{ itemId });
export const startQuest = (userId: string,questId: string) => call<QuestAttempt>(`${player(userId)}/quests/${encodeURIComponent(questId)}/attempts`,'POST');
// PHOTO_AI completes an existing timed attempt; verifiedBy is never client-controlled.
export const completeQuest = (userId: string,attemptId: string,evidence: { mimeType:'image/jpeg'|'image/png'|'image/webp';data:string }) =>
  call<CompletionResult>(`${player(userId)}/attempts/${encodeURIComponent(attemptId)}/submit`,'POST',evidence);
export const completeQuestByLocation = (userId: string,locationCode: string,attemptId?: string) => call<CompletionResult>(`${player(userId)}/quests/by-location`,'POST',{ locationCode,attemptId });
export const getQuestAttempt = (userId: string,attemptId: string) => call<QuestAttempt & { result:CompletionResult|null;verification:unknown }>(`${player(userId)}/attempts/${encodeURIComponent(attemptId)}`);
export const getLeaderboard = (university: string,scope:'ALL_TIME'|'WEEKLY'|'FRIENDS'='ALL_TIME') => call<LeaderboardEntry[]>(`leaderboard?${new URLSearchParams({ university,scope })}`);
export const searchPlayers = (query: string) => call<PlayerSearchResult[]>(`players?${new URLSearchParams({ query })}`);
export const addFriend = (userId: string,targetUserId: string) => call<{ success:true;status:'PENDING'|'ACCEPTED' }>(`${player(userId)}/friends`,'POST',{ targetUserId });
export const acceptFriend = (userId: string,requesterId: string) => call<{ success:true;status:'ACCEPTED' }>(`${player(userId)}/friends/${encodeURIComponent(requesterId)}/accept`,'POST');
export const getFriends = (userId: string) => call<(PlayerSearchResult & { status:'PENDING'|'ACCEPTED';direction:'INCOMING'|'OUTGOING' })[]>(`${player(userId)}/friends`);
export const getWorldConfig = () => call<{ gridSize:number;maxCopiesPerItem:number;footprint:{ width:number;height:number } }>('world-config');
