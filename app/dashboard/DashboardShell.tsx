"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeMusic } from "@/app/components/ThemeMusic";
import { useTutorialControls } from "@/app/components/tutorial/TutorialProvider";
import type { PlayerProfile } from "@/types/api";
import { useSocialQuest } from "./SocialQuestProvider";

const navigation = [
  { href: "/dashboard", label: "Home", icon: "⌂", tutorialId: null },
  { href: "/dashboard/quests", label: "Quests", icon: "◆", tutorialId: "nav-quests" },
  { href: "/dashboard/world", label: "Open World", icon: "◎", tutorialId: "nav-world" },
  { href: "/dashboard/shop", label: "Shop", icon: "¤", tutorialId: "nav-shop" },
  { href: "/dashboard/friends", label: "Friends", icon: "♣", tutorialId: "nav-friends" },
  { href: "/dashboard/rankings", label: "Rankings", icon: "▲", tutorialId: "nav-rankings" },
  { href: "/dashboard/profile", label: "Profile", icon: "●", tutorialId: "nav-profile" },
] as const;

export function DashboardShell({ player, children }: { player: PlayerProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const { coins, xp } = useSocialQuest();
  const { enabled: tutorialEnabled, restart: restartTutorial } = useTutorialControls();

  if (pathname === "/dashboard/world") {
    return (
      <div className="dashboard-world-shell">
        <ThemeMusic variant="world" />
        {children}
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/dashboard">
          <span>Campus</span>
          <strong>Quest</strong>
        </Link>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navigation.map((item) => {
            const active = item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                className={`dashboard-nav-link ${active ? "dashboard-nav-link-active" : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-tutorial-id={item.tutorialId ?? undefined}
              >
                <span className="dashboard-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-player-card">
          <div className="dashboard-mini-avatar" aria-hidden="true" />
          <div>
            <strong>{player.name}</strong>
            <span>Level {player.level}</span>
          </div>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div>
            <span>{player.university}</span>
            <strong>Welcome back, {player.name}</strong>
          </div>
          <div className="dashboard-resources" aria-label="Player resources">
            <ThemeMusic variant="shell" />
            <span><i className="dashboard-resource-icon dashboard-icon-xp" aria-hidden="true" /> <b>{xp}</b> XP</span>
            <span><i className="dashboard-resource-icon dashboard-icon-coins" aria-hidden="true" /> <b>{coins.toLocaleString()}</b> coins</span>
            {tutorialEnabled ? (
              <button type="button" className="dashboard-replay-tutorial" onClick={restartTutorial}>
                Replay tutorial
              </button>
            ) : null}
            <a href="/auth/logout" className="dashboard-sign-out">Sign out</a>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
