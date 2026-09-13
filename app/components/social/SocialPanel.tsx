import { FriendsPanel } from "@/app/components/friends/FriendsPanel";
import { LeaderboardPanel } from "@/app/components/leaderboard/LeaderboardPanel";
import { QuestPanel } from "@/app/components/quests/QuestPanel";
import type { FriendProfile, LeaderboardPlayer, QuestProgress, SocialTab } from "@/types/social";

interface SocialPanelProps {
  activeTab: SocialTab;
  onTabChange: (tab: SocialTab) => void;
  quests: QuestProgress[];
  onClaimQuest: (quest: QuestProgress) => void;
  friends: FriendProfile[];
  activeFriendId: string | null;
  visitedFriendIds: string[];
  onVisitFriend: (friend: FriendProfile) => void;
  onReturnHome: () => void;
  leaderboard: LeaderboardPlayer[];
}

const tabs: { id: SocialTab; label: string; icon: string }[] = [
  { id: "quests", label: "Quests", icon: "📜" },
  { id: "friends", label: "Friends", icon: "🧑‍🤝‍🧑" },
  { id: "leaderboard", label: "Ranks", icon: "🏆" },
];

export function SocialPanel(props: SocialPanelProps) {
  return (
    <aside className="w-full overflow-hidden rounded-lg border-4 border-[#6b3e1a] bg-[#17110d] shadow-[0_10px_0_#2a1b10] lg:w-[380px] lg:shrink-0">
      <nav aria-label="Social features" className="grid grid-cols-3 border-b-2 border-amber-900 bg-[#2a1b10]">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => props.onTabChange(tab.id)} aria-current={props.activeTab === tab.id ? "page" : undefined} className={`border-r border-amber-950 px-2 py-3 text-xs last:border-r-0 ${props.activeTab === tab.id ? "bg-amber-900/60 text-amber-100" : "text-stone-400 hover:bg-[#382416] hover:text-amber-200"}`}>
            <span aria-hidden="true" className="mr-1">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </nav>
      <div className="max-h-[600px] overflow-y-auto p-4 lg:h-[600px]">
        {props.activeTab === "quests" ? <QuestPanel quests={props.quests} onClaim={props.onClaimQuest} /> : null}
        {props.activeTab === "friends" ? <FriendsPanel friends={props.friends} activeFriendId={props.activeFriendId} visitedFriendIds={props.visitedFriendIds} onVisit={props.onVisitFriend} onReturnHome={props.onReturnHome} /> : null}
        {props.activeTab === "leaderboard" ? <LeaderboardPanel players={props.leaderboard} /> : null}
      </div>
    </aside>
  );
}
