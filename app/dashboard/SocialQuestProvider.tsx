"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { claimSocialQuest, saveCampusProgress } from "@/lib/api";
import { readCampusProgress } from "@/lib/campus-progress";
import {
  normalizeOutfit,
  SHOP_ITEM_BY_ID,
  type CharacterOutfit,
  type ShopItem,
} from "@/lib/shop-catalog";
import { FRIENDS, LEADERBOARD_PLAYERS, QUESTS } from "@/lib/social-data";
import type {
  FriendProfile,
  LeaderboardPlayer,
  QuestProgress,
} from "@/types/social";
import type { CompletionResult, PlayerProfile } from "@/types/api";
import { createStarterWorld, type WorldData } from "@/types/world";

export type OutfitActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

interface SocialQuestContextValue {
  activeFriend: FriendProfile | null;
  applyRewards: (result: CompletionResult) => void;
  claimQuest: (quest: QuestProgress) => void;
  coins: number;
  equipOutfitItem: (item: ShopItem) => OutfitActionResult;
  friends: FriendProfile[];
  homeWorld: WorldData;
  leaderboard: LeaderboardPlayer[];
  outfit: CharacterOutfit;
  player: PlayerProfile;
  purchaseOutfitItem: (item: ShopItem) => OutfitActionResult;
  quests: QuestProgress[];
  returnHome: () => void;
  setCoins: (coins: number) => void;
  setHomeWorld: (world: WorldData) => void;
  setOutfit: (outfit: CharacterOutfit) => void;
  visitFriend: (friend: FriendProfile) => void;
  visitedFriendIds: string[];
  viewedWorld: WorldData;
  xp: number;
}

const starterWorld = createStarterWorld();
const starterObjectCount = starterWorld.objects.length;
const SocialQuestContext = createContext<SocialQuestContextValue | null>(null);

export function SocialQuestProvider({ player, children }: { player: PlayerProfile; children: ReactNode }) {
  const saved = readCampusProgress(player.character);
  const [homeWorld, setHomeWorldState] = useState<WorldData>(saved.homeWorld ?? starterWorld);
  const [coins, setCoinsState] = useState(player.coins);
  const [xp, setXp] = useState(player.xp);
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>(saved.claimedQuestIds);
  const [visitedFriendIds, setVisitedFriendIds] = useState<string[]>(saved.visitedFriendIds);
  const [outfit, setOutfitState] = useState<CharacterOutfit>(() => normalizeOutfit(saved.outfit));
  const [activeFriend, setActiveFriend] = useState<FriendProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  const persistReady = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef({
    coins: player.coins,
    homeWorld: saved.homeWorld ?? starterWorld,
    visitedFriendIds: saved.visitedFriendIds,
    outfit: normalizeOutfit(saved.outfit),
  });

  latest.current = { coins, homeWorld, visitedFriendIds, outfit };

  const enqueueSave = useCallback((task: () => Promise<void>) => {
    saveQueue.current = saveQueue.current.then(task).catch(() => {
      // Keep local progress; a later save will retry.
    });
    return saveQueue.current;
  }, []);

  const schedulePersist = useCallback(() => {
    if (!persistReady.current) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const snapshot = latest.current;
      void enqueueSave(async () => {
        await saveCampusProgress({
          coins: snapshot.coins,
          homeWorld: snapshot.homeWorld,
          visitedFriendIds: snapshot.visitedFriendIds,
          outfit: snapshot.outfit,
        });
      });
    }, 400);
  }, [enqueueSave]);

  useEffect(() => {
    persistReady.current = true;
    const flush = () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }
      const snapshot = latest.current;
      void saveCampusProgress({
        coins: snapshot.coins,
        homeWorld: snapshot.homeWorld,
        visitedFriendIds: snapshot.visitedFriendIds,
        outfit: snapshot.outfit,
      }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, []);

  const setCoins = useCallback((next: number) => {
    setCoinsState(next);
    latest.current = { ...latest.current, coins: next };
    schedulePersist();
  }, [schedulePersist]);

  const setHomeWorld = useCallback((world: WorldData) => {
    setHomeWorldState(world);
    latest.current = { ...latest.current, homeWorld: world };
    schedulePersist();
  }, [schedulePersist]);

  const setOutfit = useCallback((next: CharacterOutfit) => {
    const normalized = normalizeOutfit(next);
    setOutfitState(normalized);
    latest.current = { ...latest.current, outfit: normalized };
    schedulePersist();
  }, [schedulePersist]);

  // Swap these implementations for official purchase/equip API calls later.
  const equipOutfitItem = useCallback((item: ShopItem): OutfitActionResult => {
    if (!latest.current.outfit.ownedItemIds.includes(item.id)) {
      return { ok: false, message: `You do not own ${item.name} yet.` };
    }
    setOutfit({
      ...latest.current.outfit,
      equipped: {
        ...latest.current.outfit.equipped,
        [item.category]: item.id,
      },
    });
    return { ok: true, message: `${item.name} equipped.` };
  }, [setOutfit]);

  const purchaseOutfitItem = useCallback((item: ShopItem): OutfitActionResult => {
    const currentOutfit = latest.current.outfit;
    if (currentOutfit.ownedItemIds.includes(item.id)) {
      return equipOutfitItem(item);
    }

    const balance = latest.current.coins;
    if (balance < item.price) {
      return {
        ok: false,
        message: `You need ${item.price - balance} more coins for ${item.name}.`,
      };
    }

    const nextCoins = balance - item.price;
    const nextOutfit = normalizeOutfit({
      ownedItemIds: [...currentOutfit.ownedItemIds, item.id],
      equipped: {
        ...currentOutfit.equipped,
        [item.category]: item.id,
      },
    });

    setCoinsState(nextCoins);
    setOutfitState(nextOutfit);
    latest.current = {
      ...latest.current,
      coins: nextCoins,
      outfit: nextOutfit,
    };
    schedulePersist();
    return { ok: true, message: `${item.name} purchased and equipped!` };
  }, [equipOutfitItem, schedulePersist]);

  const quests = useMemo<QuestProgress[]>(() => {
    const buildingCount = homeWorld.objects.filter(
      (object) => object.kind === "building",
    ).length;
    const newlyPlacedCount = Math.max(
      0,
      homeWorld.objects.length - starterObjectCount,
    );

    return QUESTS.map((quest) => ({
      ...quest,
      progress:
        quest.id === "campus-foundation"
          ? buildingCount
          : quest.id === "campus-creator"
            ? newlyPlacedCount
            : visitedFriendIds.length,
      claimed: claimedQuestIds.includes(quest.id),
    }));
  }, [claimedQuestIds, homeWorld.objects, visitedFriendIds.length]);

  const leaderboard = useMemo<LeaderboardPlayer[]>(
    () => [
      ...LEADERBOARD_PLAYERS,
      {
        id: player.id,
        name: player.name,
        initials: player.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2),
        xp,
        level:
          player.level +
          Math.floor((xp - player.xp) / 150),
        isCurrentUser: true,
      },
    ],
    [player, xp],
  );

  const applyRewards = useCallback((result: CompletionResult) => {
    setCoinsState(result.newCoins);
    setXp(result.newXp);
    latest.current = { ...latest.current, coins: result.newCoins };
    schedulePersist();
  }, [schedulePersist]);

  const claimQuest = useCallback((quest: QuestProgress) => {
    if (claiming || quest.claimed || quest.progress < quest.goal) return;
    setClaiming(true);
    if (persistTimer.current) clearTimeout(persistTimer.current);

    setClaimedQuestIds((current) =>
      current.includes(quest.id) ? current : [...current, quest.id],
    );
    setCoinsState((current) => current + quest.rewardCoins);
    setXp((current) => current + quest.rewardXp);

    void enqueueSave(async () => {
      try {
        const result = await claimSocialQuest(quest.id);
        setClaimedQuestIds(result.claimedQuestIds);
        setCoinsState(result.coins);
        setXp(result.xp);
        const nextOutfit = normalizeOutfit(result.outfit);
        setOutfitState(nextOutfit);
        latest.current = {
          ...latest.current,
          coins: result.coins,
          visitedFriendIds: result.visitedFriendIds,
          homeWorld: result.homeWorld ?? latest.current.homeWorld,
          outfit: nextOutfit,
        };
        await saveCampusProgress({
          coins: result.coins,
          homeWorld: latest.current.homeWorld,
          visitedFriendIds: latest.current.visitedFriendIds,
          outfit: latest.current.outfit,
        });
      } catch {
        setClaimedQuestIds((current) => current.filter((id) => id !== quest.id));
        setCoinsState((current) => Math.max(0, current - quest.rewardCoins));
        setXp((current) => Math.max(0, current - quest.rewardXp));
        throw new Error("claim failed");
      } finally {
        setClaiming(false);
      }
    });
  }, [claiming, enqueueSave]);

  const visitFriend = useCallback((friend: FriendProfile) => {
    setActiveFriend(friend);
    setVisitedFriendIds((current) => {
      if (current.includes(friend.id)) return current;
      const next = [...current, friend.id];
      latest.current = { ...latest.current, visitedFriendIds: next };
      schedulePersist();
      return next;
    });
  }, [schedulePersist]);

  const returnHome = () => setActiveFriend(null);

  return (
    <SocialQuestContext.Provider
      value={{
        activeFriend,
        applyRewards,
        claimQuest,
        coins,
        equipOutfitItem,
        friends: FRIENDS,
        homeWorld,
        leaderboard,
        outfit,
        player,
        purchaseOutfitItem,
        quests,
        returnHome,
        setCoins,
        setHomeWorld,
        setOutfit,
        visitFriend,
        visitedFriendIds,
        viewedWorld: activeFriend?.world ?? homeWorld,
        xp,
      }}
    >
      {children}
    </SocialQuestContext.Provider>
  );
}

export function useSocialQuest() {
  const value = useContext(SocialQuestContext);
  if (!value) {
    throw new Error("useSocialQuest must be used inside SocialQuestProvider");
  }
  return value;
}

export function shopItemById(itemId: string | null | undefined) {
  if (!itemId) return undefined;
  return SHOP_ITEM_BY_ID[itemId];
}
