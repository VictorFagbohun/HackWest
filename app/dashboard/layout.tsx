import type { Metadata } from "next";
import { DashboardShell } from "./DashboardShell";
import { SocialQuestProvider } from "./SocialQuestProvider";

export const metadata: Metadata = {
  title: "Dashboard | Campus Quest",
  description: "Track quests, explore the campus, and grow your student profile.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocialQuestProvider>
      <DashboardShell>{children}</DashboardShell>
    </SocialQuestProvider>
  );
}
