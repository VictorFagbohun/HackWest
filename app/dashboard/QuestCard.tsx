import type { Quest } from "@/types/api";

const categoryLabels: Record<Quest["category"], string> = {
  SCHOLAR: "Scholar",
  WELLNESS: "Wellness",
  COMMUNITY: "Community",
  CAREER: "Career",
};

const categoryAssets: Record<Quest["category"], string> = {
  SCHOLAR: "/game/buildings/library.png",
  WELLNESS: "/game/buildings/gym.png",
  COMMUNITY: "/game/buildings/org-hall.png",
  CAREER: "/game/buildings/career.png",
};

export function QuestCard({ quest, compact = false }: { quest: Quest; compact?: boolean }) {
  return (
    <article className={`dashboard-quest-card dashboard-category-${quest.category.toLowerCase()} ${compact ? "dashboard-quest-compact" : ""}`}>
      <div className="dashboard-quest-heading">
        <span className="dashboard-quest-category">
          {/* These sprites come from the same asset pack used by Phaser. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dashboard-quest-icon" src={categoryAssets[quest.category]} alt="" aria-hidden="true" />
          {categoryLabels[quest.category]}
        </span>
        <small>{quest.frequency.replace("_", " ")}</small>
      </div>
      <h3>{quest.title}</h3>
      <p>{quest.description}</p>
      <div className="dashboard-reward-row">
        <span><span className="dashboard-reward-icon dashboard-icon-xp" aria-hidden="true" /> +{quest.xp_reward} XP</span>
        <span><span className="dashboard-reward-icon dashboard-icon-coins" aria-hidden="true" /> +{quest.coin_reward} coins</span>
      </div>
    </article>
  );
}
