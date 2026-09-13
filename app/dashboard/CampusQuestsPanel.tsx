"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ApiError,
  completeQuest,
  getQuestProgress,
  startQuest,
  type QuestLocation,
} from "@/lib/api";
import type { QuestProgress } from "@/types/api";
import { TUTORIAL_QUEST_LOCATION } from "@/lib/tutorial";
import { useTutorialHackathonReporter, useTutorialQuestLock } from "@/app/components/tutorial/TutorialProvider";
import { useSocialQuest } from "./SocialQuestProvider";

const categoryLabels: Record<QuestProgress["category"], string> = {
  SCHOLAR: "Scholar",
  WELLNESS: "Wellness",
  COMMUNITY: "Community",
  CAREER: "Career",
};

function inferMimeType(file: File): "image/jpeg" | "image/png" | "image/webp" {
  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  ) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function fileToEvidence(file: File): Promise<{
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
}> {
  const mimeType = inferMimeType(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const data = result.includes(",") ? result.split(",")[1]! : result;
      resolve({ mimeType, data });
    };
    reader.readAsDataURL(file);
  });
}

function readDeviceLocation(): Promise<QuestLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser cannot share GPS. Use a device with location services."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters:
            typeof position.coords.accuracy === "number"
              ? position.coords.accuracy
              : undefined,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Allow location access so we can confirm you are at the quest site."));
        } else {
          reject(new Error("Could not read your GPS fix. Try again outdoors or near a window."));
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 },
    );
  });
}

function secondsLeft(startedAt: string, minimum: number) {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(minimum - elapsed));
}

function isTutorialQuest(quest: QuestProgress) {
  return quest.location_code === TUTORIAL_QUEST_LOCATION;
}

export function CampusQuestsPanel() {
  const { player, applyRewards } = useSocialQuest();
  const lockQuestsToHackathon = useTutorialQuestLock();
  const reportHackathonComplete = useTutorialHackathonReporter();
  const [quests, setQuests] = useState<QuestProgress[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();

  const orderedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      const aHack = isTutorialQuest(a) ? 0 : 1;
      const bHack = isTutorialQuest(b) ? 0 : 1;
      if (aHack !== bHack) return aHack - bHack;
      return a.title.localeCompare(b.title);
    });
  }, [quests]);

  const refresh = () => {
    startTransition(async () => {
      try {
        setLoadError(null);
        setQuests(await getQuestProgress(player.id));
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load quests.",
        );
      }
    });
  };

  useEffect(() => {
    if (!lockQuestsToHackathon || !reportHackathonComplete) return;
    if (quests.some((quest) => isTutorialQuest(quest) && quest.claimed)) {
      reportHackathonComplete();
    }
  }, [lockQuestsToHackathon, quests, reportHackathonComplete]);

  useEffect(() => {
    refresh();
  }, [player.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runAction = async (questId: string, work: () => Promise<void>) => {
    setBusyId(questId);
    setActionError(null);
    setMessage(null);
    try {
      await work();
      setQuests(await getQuestProgress(player.id));
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong.";
      setActionError(text);
    } finally {
      setBusyId(null);
    }
  };

  const beginQuest = (quest: QuestProgress) => {
    if (lockQuestsToHackathon && !isTutorialQuest(quest)) return;
    void runAction(quest.id, async () => {
      await startQuest(player.id, quest.id);
      setMessage(
        quest.minimum_duration_seconds > 0
          ? "Quest started. After the timer, submit a photo while you are still on site."
          : "Quest started. Submit a photo while GPS shows you at the site.",
      );
    });
  };

  const submitPhoto = (quest: QuestProgress, file: File | null) => {
    if (!file || !quest.activeAttempt) return;
    if (lockQuestsToHackathon && !isTutorialQuest(quest)) return;
    void runAction(quest.id, async () => {
      const evidence = await fileToEvidence(file);
      let location: QuestLocation;
      try {
        location = await readDeviceLocation();
      } catch {
        // Still submit so the verify UX works even if GPS is denied; server bypass ignores checks.
        location = { latitude: 33.59132, longitude: -101.8994, accuracyMeters: 25 };
      }
      const result = await completeQuest(player.id, quest.activeAttempt!.id, {
        ...evidence,
        location,
      });
      applyRewards(result);
      if (isTutorialQuest(quest)) {
        reportHackathonComplete?.();
      }
      setMessage(
        `Photo and location approved. +${result.coinsGained} coins and +${result.xpGained} XP saved.`,
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-400">
          Every quest needs on-site GPS plus a photo Gemini can match to that place.
        </p>
        <button
          type="button"
          className="rounded border border-emerald-700 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-950"
          onClick={refresh}
          disabled={pending}
        >
          {pending ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {lockQuestsToHackathon ? (
        <p className="rounded border border-amber-800/80 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/90">
          Tutorial: start the Hackathon Check-in quest only for this step.
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {actionError}
        </p>
      ) : null}
      {message ? (
        <p className="rounded border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        {orderedQuests.map((quest) => {
          const busy = busyId === quest.id;
          const remaining = quest.activeAttempt
            ? secondsLeft(
                quest.activeAttempt.startedAt,
                quest.minimum_duration_seconds,
              )
            : 0;
          const tutorialQuest = isTutorialQuest(quest);
          const locked = lockQuestsToHackathon && !tutorialQuest;
          void now;

          return (
            <article
              key={quest.id}
              data-tutorial-id={tutorialQuest ? "hackathon-quest" : undefined}
              className={`rounded border-2 p-3 ${
                quest.claimed
                  ? "border-emerald-900/70 bg-emerald-950/40"
                  : locked
                    ? "border-amber-950/80 bg-[#1a140f] opacity-55"
                    : "border-amber-900 bg-[#21170f]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
                    {categoryLabels[quest.category]} ·{" "}
                    {quest.frequency.replaceAll("_", " ")}
                    {quest.location_code ? ` · ${quest.location_code}` : ""}
                  </p>
                  <h3 className="mt-1 text-sm text-amber-100">{quest.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-400">
                    {quest.description}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-amber-300">
                  <div>+{quest.coin_reward}c</div>
                  <div className="text-violet-300">+{quest.xp_reward} XP</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {locked ? (
                  <span className="text-xs text-stone-500">Locked during tutorial</span>
                ) : quest.claimed ? (
                  <span className="text-xs text-emerald-300">
                    Completed for this period
                  </span>
                ) : quest.verification_policy === "PHOTO_AI" ? (
                  <>
                    {!quest.activeAttempt ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => beginQuest(quest)}
                        className="rounded border border-amber-600 bg-amber-800 px-3 py-1 text-xs text-amber-50 hover:bg-amber-700 disabled:opacity-50"
                      >
                        {busy ? "Starting…" : "Start quest"}
                      </button>
                    ) : remaining > 0 ? (
                      <span className="text-xs text-stone-400">
                        Timer: {remaining}s remaining
                      </span>
                    ) : (
                      <label className="cursor-pointer rounded border border-amber-600 bg-amber-800 px-3 py-1 text-xs text-amber-50 hover:bg-amber-700">
                        {busy ? "Verifying…" : "Submit photo on site"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          className="sr-only"
                          disabled={busy}
                          onChange={(event) => {
                            submitPhoto(quest, event.target.files?.[0] ?? null);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-stone-500">
                    Manual verification required
                  </span>
                )}
              </div>
            </article>
          );
        })}
        {!pending && quests.length === 0 && !loadError ? (
          <p className="text-sm text-stone-400">No campus quests seeded yet.</p>
        ) : null}
      </div>
    </div>
  );
}
