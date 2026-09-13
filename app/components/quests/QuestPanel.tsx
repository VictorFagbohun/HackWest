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
      <div className="quest-panel-header mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="quest-panel-eyebrow text-[10px] uppercase tracking-[0.22em]">Adventure log</p>
          <h2 id="quests-heading" className="quest-panel-title text-xl">Today&apos;s quests</h2>
        </div>
        <span className="quest-panel-count rounded px-2 py-1 text-xs">
          {completed}/{quests.length} claimed
        </span>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => {
          const progress = Math.min(quest.progress, quest.goal);
          const percent = Math.round((progress / quest.goal) * 100);
          const ready = progress >= quest.goal;

          return (
            <article key={quest.id} className={`quest-panel-card rounded border-2 p-3 ${quest.claimed ? "quest-panel-card-claimed" : ""}`}>
              <div className="flex gap-3">
                <div className="quest-panel-category-icon flex h-10 w-10 shrink-0 items-center justify-center rounded text-lg" aria-hidden="true">
                  {categoryIcon[quest.category]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="quest-panel-quest-title text-sm">{quest.title}</p>
                      <p className="quest-panel-description mt-0.5 text-xs leading-relaxed">{quest.description}</p>
                    </div>
                    <span className="quest-panel-coins shrink-0 text-xs">+{quest.rewardCoins}c</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="quest-panel-progress h-2 flex-1 overflow-hidden rounded" role="progressbar" aria-label={`${quest.title} progress`} aria-valuemin={0} aria-valuemax={quest.goal} aria-valuenow={progress}>
                      <div className="quest-panel-progress-fill h-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="quest-panel-progress-value w-9 text-right text-[11px]">{progress}/{quest.goal}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="quest-panel-xp text-[11px]">+{quest.rewardXp} XP</span>
                    {quest.claimed ? (
                      <span className="quest-panel-claimed text-xs">✓ Claimed</span>
                    ) : (
                      <button type="button" disabled={!ready} onClick={() => onClaim(quest)} className="quest-panel-action rounded px-3 py-1 text-xs transition disabled:cursor-not-allowed">
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
