"use client";

import { useMemo, useState } from "react";
import type { FriendProfile } from "@/types/social";
import { VICTOR_FRIEND_ID } from "@/lib/tutorial";
import { useTutorialVisitLock } from "@/app/components/tutorial/TutorialProvider";

interface FriendsPanelProps {
  friends: FriendProfile[];
  activeFriendId: string | null;
  visitedFriendIds: string[];
  onVisit: (friend: FriendProfile) => void;
  onReturnHome: () => void;
}

const statusColor = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-stone-500",
};

export function FriendsPanel({ friends, activeFriendId, visitedFriendIds, onVisit, onReturnHome }: FriendsPanelProps) {
  const [query, setQuery] = useState("");
  const lockVisitsToVictor = useTutorialVisitLock();
  const filteredFriends = useMemo(
    () => friends.filter((friend) => friend.name.toLowerCase().includes(query.toLowerCase())),
    [friends, query],
  );

  return (
    <section aria-labelledby="friends-heading">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/60">Your circle</p>
        <h2 id="friends-heading" className="text-xl text-amber-100">Friends</h2>
      </div>

      {activeFriendId ? (
        <button type="button" onClick={onReturnHome} className="mb-3 w-full rounded border-2 border-emerald-800 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900/60">
          ← Return to my campus
        </button>
      ) : null}

      {lockVisitsToVictor ? (
        <p className="mb-3 rounded border border-amber-800/80 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/90">
          Tutorial: visit Victor Fagbohun only for this step.
        </p>
      ) : null}

      <label className="mb-3 block">
        <span className="sr-only">Find a friend</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a friend..." className="w-full rounded border-2 border-amber-900 bg-[#17110d] px-3 py-2 text-sm text-amber-100 outline-none placeholder:text-stone-600 focus:border-amber-600" />
      </label>

      <div className="space-y-2">
        {filteredFriends.map((friend) => {
          const active = activeFriendId === friend.id;
          const visited = visitedFriendIds.includes(friend.id);
          const isVictor = friend.id === VICTOR_FRIEND_ID;
          const visitBlocked = lockVisitsToVictor && !isVictor;
          return (
            <article
              key={friend.id}
              className={`flex items-center gap-3 rounded border-2 p-3 ${
                active
                  ? "border-emerald-600 bg-emerald-950/60"
                  : visitBlocked
                    ? "border-amber-950/80 bg-[#1a140f] opacity-55"
                    : "border-amber-900 bg-[#21170f]"
              }`}
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[#4a2f1b] text-sm text-amber-100">
                {friend.initials}
                <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#21170f] ${statusColor[friend.status]}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm text-amber-100">{friend.name}</p>
                  {visited ? <span title="Campus visited" className="text-[10px] text-emerald-300">✓</span> : null}
                </div>
                <p className="truncate text-[11px] text-stone-400">Lv. {friend.level} · {friend.major}</p>
                <p className="mt-0.5 text-[10px] capitalize text-stone-500">{friend.lastSeen}</p>
              </div>
              <button
                type="button"
                disabled={active || visitBlocked}
                onClick={() => {
                  if (visitBlocked) return;
                  onVisit(friend);
                }}
                data-tutorial-id={isVictor ? "visit-victor" : undefined}
                title={visitBlocked ? "Finish the tutorial step with Victor first" : undefined}
                className="shrink-0 rounded border border-amber-700 bg-[#332113] px-2.5 py-1.5 text-xs text-amber-100 hover:bg-amber-900 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-900 disabled:text-stone-500 disabled:opacity-70"
              >
                {active ? "Visiting" : visitBlocked ? "Locked" : "Visit"}
              </button>
            </article>
          );
        })}
        {filteredFriends.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">No friends found.</p> : null}
      </div>
    </section>
  );
}
