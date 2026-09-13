"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { playerProfile } from "./mockData";
import { useSocialQuest } from "./SocialQuestProvider";

const navigation = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/dashboard/quests", label: "Quests", icon: "◆" },
  { href: "/dashboard/world", label: "Open World", icon: "◎" },
  { href: "/dashboard/friends", label: "Friends", icon: "♣" },
  { href: "/dashboard/rankings", label: "Rankings", icon: "▲" },
  { href: "/dashboard/profile", label: "Profile", icon: "●" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { coins, xp } = useSocialQuest();

  if (pathname === "/dashboard/world") {
    return <div className="dashboard-world-shell">{children}</div>;
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
            <strong>{playerProfile.name}</strong>
            <span>Level {playerProfile.level}</span>
          </div>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div>
            <span>{playerProfile.university}</span>
            <strong>Welcome back, {playerProfile.name}</strong>
          </div>
          <div className="dashboard-resources" aria-label="Player resources">
            <span><i className="dashboard-resource-icon dashboard-icon-xp" aria-hidden="true" /> <b>{xp}</b> XP</span>
            <span><i className="dashboard-resource-icon dashboard-icon-coins" aria-hidden="true" /> <b>{coins.toLocaleString()}</b> coins</span>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
