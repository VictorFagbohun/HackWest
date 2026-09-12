import type { QuestProgress } from "@/types/social";

interface QuestPanelProps {
  quests: QuestProgress[];
  onClaim: (quest: QuestProgress) => void;
}

const categoryIcon = {
  Campus: "🏡",
  Social: "🤝",
  Daily: "⭐",
};

export function QuestPanel({ quests, onClaim }: QuestPanelProps) {
  const completed = quests.filter((quest) => quest.claimed).length;

  return (
    <section aria-labelledby="quests-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/60">Adventure log</p>
          <h2 id="quests-heading" className="text-xl text-amber-100">Today&apos;s quests</h2>
        </div>
        <span className="rounded border border-emerald-800 bg-emerald-950/70 px-2 py-1 text-xs text-emerald-200">
          {completed}/{quests.length} claimed
        </span>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => {
          const progress = Math.min(quest.progress, quest.goal);
          const percent = Math.round((progress / quest.goal) * 100);
          const ready = progress >= quest.goal;

          return (
            <article key={quest.id} className={`rounded border-2 p-3 ${quest.claimed ? "border-emerald-900/70 bg-emerald-950/40" : "border-amber-900 bg-[#21170f]"}`}>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-amber-800 bg-[#342315] text-lg" aria-hidden="true">
                  {categoryIcon[quest.category]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-amber-100">{quest.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-stone-400">{quest.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-amber-300">+{quest.rewardCoins}c</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded bg-stone-800" role="progressbar" aria-label={`${quest.title} progress`} aria-valuemin={0} aria-valuemax={quest.goal} aria-valuenow={progress}>
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-9 text-right text-[11px] text-stone-400">{progress}/{quest.goal}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-violet-300">+{quest.rewardXp} XP</span>
                    {quest.claimed ? (
                      <span className="text-xs text-emerald-300">✓ Claimed</span>
                    ) : (
                      <button type="button" disabled={!ready} onClick={() => onClaim(quest)} className="rounded border border-amber-600 bg-amber-800 px-3 py-1 text-xs text-amber-50 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800 disabled:text-stone-500">
                        {ready ? "Claim reward" : "In progress"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
