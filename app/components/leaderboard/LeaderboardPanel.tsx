import type { LeaderboardPlayer } from "@/types/social";

interface LeaderboardPanelProps {
  players: LeaderboardPlayer[];
}

const medals = ["🥇", "🥈", "🥉"];

export function LeaderboardPanel({ players }: LeaderboardPanelProps) {
  const ranked = [...players].sort((a, b) => b.xp - a.xp);

  return (
    <section aria-labelledby="leaderboard-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/60">Weekly XP</p>
          <h2 id="leaderboard-heading" className="text-xl text-amber-100">Leaderboard</h2>
        </div>
        <span className="text-[10px] text-stone-500">Resets Monday</span>
      </div>

      <div className="overflow-hidden rounded border-2 border-amber-900 bg-[#21170f]">
        {ranked.map((player, index) => (
          <div key={player.id} className={`flex items-center gap-3 border-b border-amber-950 px-3 py-3 last:border-b-0 ${player.isCurrentUser ? "bg-emerald-950/70" : ""}`}>
            <span className="w-7 text-center text-sm text-stone-400">{medals[index] ?? `#${index + 1}`}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#4a2f1b] text-xs text-amber-100">{player.initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-amber-100">{player.name}{player.isCurrentUser ? <span className="ml-1 text-xs text-emerald-300">(you)</span> : null}</p>
              <p className="text-[11px] text-stone-500">Level {player.level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-violet-200">{player.xp.toLocaleString()}</p>
              <p className="text-[9px] uppercase tracking-wider text-stone-500">XP</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
