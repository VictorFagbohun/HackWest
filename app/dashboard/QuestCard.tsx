import type { Quest } from "./mockData";
import { categoryLabels } from "./mockData";

export function QuestCard({ quest, compact = false }: { quest: Quest; compact?: boolean }) {
  return (
    <article className={`dashboard-quest-card dashboard-category-${quest.category.toLowerCase()} ${compact ? "dashboard-quest-compact" : ""}`}>
      <div className="dashboard-quest-heading">
        <span>{categoryLabels[quest.category]}</span>
        <small>{quest.frequency.replace("_", " ")}</small>
      </div>
      <h3>{quest.title}</h3>
      <p>{quest.description}</p>
      <div className="dashboard-reward-row">
        <span>+{quest.xp_reward} XP</span>
        <span>+{quest.coin_reward} coins</span>
      </div>
    </article>
  );
}
