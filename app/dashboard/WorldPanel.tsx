"use client";

import { GameWorld } from "@/app/components/game/GameWorld";
import { useSocialQuest } from "./SocialQuestProvider";

export function WorldPanel() {
  const {
    activeFriend,
    coins,
    player,
    returnHome,
    setCoins,
    setHomeWorld,
    viewedWorld,
  } = useSocialQuest();

  return (
    <>
      {activeFriend ? (
        <div className="absolute left-1/2 top-32 z-30 flex -translate-x-1/2 items-center gap-3 rounded border-2 border-emerald-700 bg-emerald-950/90 px-4 py-2 text-sm text-emerald-100">
          <span>Visiting {activeFriend.name}&apos;s campus</span>
          <button
            type="button"
            onClick={returnHome}
            className="rounded border border-emerald-600 px-2 py-1 text-xs hover:bg-emerald-900"
          >
            Return home
          </button>
        </div>
      ) : null}
      <GameWorld
        world={viewedWorld}
        coins={coins}
        editable={!activeFriend}
        playerName={player.name}
        worldOwnerName={activeFriend?.name ?? player.name}
        onWorldChange={activeFriend ? undefined : setHomeWorld}
        onCoinsChange={activeFriend ? undefined : setCoins}
      />
    </>
  );
}
