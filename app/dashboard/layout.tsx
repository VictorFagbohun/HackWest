import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authConfigured, getAuth0 } from "@/lib/auth0";
import { requirePlayer } from "@/lib/auth";
import { TutorialProvider } from "@/app/components/tutorial/TutorialProvider";
import { DashboardShell } from "./DashboardShell";
import { SocialQuestProvider } from "./SocialQuestProvider";

export const metadata: Metadata = {
  title: "Dashboard | Campus Quest",
  description: "Track quests, explore the campus, and grow your student profile.",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!authConfigured()) {
    redirect("/");
  }

  const session = await getAuth0().getSession();
  if (!session?.user?.sub) {
    redirect("/login");
  }

  const player = await requirePlayer();

  return (
    <SocialQuestProvider player={player}>
      <TutorialProvider playerName={player.name}>
        <DashboardShell player={player}>{children}</DashboardShell>
      </TutorialProvider>
    </SocialQuestProvider>
  );
}
