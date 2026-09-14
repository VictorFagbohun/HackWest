"use client";

import Link from "next/link";
import { useSocialQuest } from "@/app/dashboard/SocialQuestProvider";

export function WorldExitLink() {
  const { activeFriend, returnHome } = useSocialQuest();

  return (
    <Link
      className="dashboard-world-exit"
      href="/dashboard"
      data-tutorial-id="world-exit"
      onClick={() => {
        if (activeFriend) returnHome();
      }}
    >
      <span aria-hidden="true">←</span>
      Exit world
    </Link>
  );
}
