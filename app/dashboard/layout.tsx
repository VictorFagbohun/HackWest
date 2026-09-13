import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth0";
import { requirePlayer } from "@/lib/auth";
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

  await requirePlayer();

  return (
    <SocialQuestProvider>
      <DashboardShell>{children}</DashboardShell>
    </SocialQuestProvider>
  );
}
