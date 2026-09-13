"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { resetTutorialQuest } from "@/lib/api";
import {
  clearTutorialReplayCookie,
  isMoveKey,
  isTutorialEnabled,
  isTutorialVoiceEnabled,
  pathMatches,
  readTutorialCompleted,
  readTutorialStepId,
  shouldForceTutorialReplay,
  stepVisibleOnPath,
  TUTORIAL_QUEST_LOCATION,
  TUTORIAL_STEPS,
  VICTOR_FRIEND_ID,
  writeTutorialCompleted,
  writeTutorialStepId,
  type TutorialStep,
  type TutorialWorldSignals,
} from "@/lib/tutorial";
import { useSocialQuest } from "@/app/dashboard/SocialQuestProvider";

type TutorialContextValue = {
  active: boolean;
  enabled: boolean;
  step: TutorialStep | null;
  /** Restart the tour from step one, wherever the player is. */
  restart: () => void;
  reportWorld: (signals: Partial<TutorialWorldSignals>) => void;
  reportHackathonComplete: () => void;
  /** During the visit step, only Victor can be visited. */
  lockVisitsToVictor: boolean;
  /** During the quests step, only the Hackathon quest is interactive. */
  lockQuestsToHackathon: boolean;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

const DEFAULT_WORLD: TutorialWorldSignals = {
  editable: true,
  buildMode: false,
  selectedCatalogId: null,
  objectCount: 0,
  prompt: null,
  worldReady: false,
};

function speakTutorialLine(text: string, enabled: boolean) {
  if (!enabled || !text) return;
  if (process.env.NODE_ENV === "development") {
    console.debug("[tutorial voice]", text);
  }
}

function cueForHighlight(highlight: string): string {
  switch (highlight) {
    case "build-toggle":
      return "Click Build";
    case "build-catalog":
      return "Pick an item";
    case "world-exit":
      return "Click Exit";
    case "nav-world":
      return "Open World";
    case "nav-quests":
      return "Click Quests";
    case "nav-shop":
      return "Click Shop";
    case "nav-friends":
      return "Click Friends";
    case "nav-rankings":
      return "Click Rankings";
    case "nav-profile":
      return "Click Profile";
    case "visit-victor":
      return "Visit Victor";
    case "canvas":
      return "Use the map";
    case "quests-panel":
      return "Your quests";
    case "hackathon-quest":
      return "Start this quest";
    case "shop-catalog":
      return "Shop items";
    case "rankings-panel":
      return "Leaderboard";
    case "profile-card":
      return "Your card";
    default:
      return "Look here";
  }
}

export function TutorialProvider({
  playerName,
  children,
}: {
  playerName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeFriend, returnHome } = useSocialQuest();
  const visiting = Boolean(activeFriend);
  const visitingVictor = activeFriend?.id === VICTOR_FRIEND_ID;

  const [enabled] = useState(() => isTutorialEnabled());
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [world, setWorld] = useState<TutorialWorldSignals>(DEFAULT_WORLD);
  const [hackathonComplete, setHackathonComplete] = useState(false);
  const placeBaselineRef = useRef<number | null>(null);
  const spokeStepRef = useRef<string | null>(null);
  const forceHandledRef = useRef(false);
  const voiceEnabled = isTutorialVoiceEnabled();

  const reportWorld = useCallback((signals: Partial<TutorialWorldSignals>) => {
    setWorld((prev) => ({ ...prev, ...signals }));
  }, []);

  const reportHackathonComplete = useCallback(() => {
    setHackathonComplete(true);
  }, []);

  const beginReplay = useCallback(() => {
    forceHandledRef.current = true;
    writeTutorialCompleted(false);
    writeTutorialStepId(TUTORIAL_STEPS[0].id);
    setStepIndex(0);
    setHackathonComplete(false);
    setExiting(false);
    setVisible(true);
    spokeStepRef.current = null;
    placeBaselineRef.current = null;
    void resetTutorialQuest(TUTORIAL_QUEST_LOCATION).catch((error) => {
      console.warn("[tutorial] could not reset hackathon quest", error);
    });
    // Consume both replay triggers so later advances are not reset.
    clearTutorialReplayCookie();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("tutorial");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Ignore URL rewrite failures.
    }
    if (!pathname.startsWith("/dashboard/world")) {
      router.replace("/dashboard/world");
    }
  }, [pathname, router]);

  // Start / resume / force-replay. Re-runs on navigation so ?tutorial=1 works
  // even if the provider already mounted on /dashboard.
  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    if (shouldForceTutorialReplay()) {
      if (!forceHandledRef.current) beginReplay();
      setVisible(true);
      return;
    }

    forceHandledRef.current = false;

    if (readTutorialCompleted()) {
      setVisible(false);
      return;
    }

    const savedId = readTutorialStepId();
    if (savedId) {
      const savedIndex = TUTORIAL_STEPS.findIndex((s) => s.id === savedId);
      setStepIndex(savedIndex >= 0 ? savedIndex : 0);
      setVisible(true);
      setExiting(false);
      return;
    }

    if (pathname.startsWith("/dashboard/world")) {
      setStepIndex(0);
      setVisible(true);
      setExiting(false);
      writeTutorialStepId(TUTORIAL_STEPS[0].id);
    }
  }, [enabled, pathname, router, beginReplay]);

  const step = visible ? TUTORIAL_STEPS[stepIndex] ?? null : null;

  useEffect(() => {
    if (!visible || !step) return;
    writeTutorialStepId(step.id);
  }, [visible, step]);

  const finish = useCallback(() => {
    writeTutorialCompleted(true);
    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
      document.documentElement.removeAttribute("data-tutorial-highlight");
      document.documentElement.removeAttribute("data-tutorial-cue");
    }, 280);
  }, []);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= TUTORIAL_STEPS.length) {
        finish();
        return;
      }
      setStepIndex(nextIndex);
    },
    [finish],
  );

  const advance = useCallback(() => {
    goToIndex(stepIndex + 1);
  }, [goToIndex, stepIndex]);

  // Skip steps that do not apply in the current context.
  useEffect(() => {
    if (!visible || !step) return;
    const editableHere = world.editable && !visiting;
    if (step.requiresEditable && !editableHere) {
      goToIndex(stepIndex + 1);
      return;
    }
    if (step.requiresVisiting && !visitingVictor) {
      goToIndex(stepIndex + 1);
    }
  }, [
    visible,
    step,
    stepIndex,
    world.editable,
    visiting,
    visitingVictor,
    goToIndex,
  ]);

  useEffect(() => {
    if (!visible || !step) return;
    if (spokeStepRef.current === step.id) return;
    spokeStepRef.current = step.id;
    const name = playerName.trim();
    const line =
      step.id === "welcome" && name
        ? `Hey ${name}. ${step.voiceText}`
        : step.voiceText;
    speakTutorialLine(line, voiceEnabled);
  }, [visible, step, playerName, voiceEnabled]);

  useEffect(() => {
    if (!visible || !step || step.advance !== "place") {
      placeBaselineRef.current = null;
      return;
    }
    if (placeBaselineRef.current === null) {
      placeBaselineRef.current = world.objectCount;
    }
  }, [visible, step, world.objectCount]);

  useEffect(() => {
    if (!visible || !step) return;

    if (step.advance === "build" && world.buildMode) {
      advance();
      return;
    }
    if (step.advance === "select" && world.selectedCatalogId) {
      advance();
      return;
    }
    if (
      step.advance === "place" &&
      placeBaselineRef.current !== null &&
      world.objectCount > placeBaselineRef.current
    ) {
      advance();
      return;
    }
    if (step.advance === "inspect" && world.prompt) {
      advance();
      return;
    }
    if (step.advance === "visit-victor" && visitingVictor) {
      advance();
      return;
    }
    if (step.advance === "hackathon-complete" && hackathonComplete) {
      advance();
      return;
    }
    if (step.advance === "route" && step.targetRoute) {
      if (step.id === "exit-world" || step.id === "exit-visit") {
        if (!pathMatches(pathname, "/dashboard/world")) advance();
        return;
      }
      if (pathMatches(pathname, step.targetRoute)) advance();
    }
  }, [
    visible,
    step,
    world.buildMode,
    world.selectedCatalogId,
    world.objectCount,
    world.prompt,
    visitingVictor,
    hackathonComplete,
    pathname,
    advance,
  ]);

  useEffect(() => {
    if (!visible || !step) return;
    if (step.advance !== "move" && step.advance !== "inspect") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (step.advance === "move" && isMoveKey(event.code)) {
        advance();
        return;
      }
      if (
        step.advance === "inspect" &&
        (event.code === "KeyE" || event.key === "e" || event.key === "E")
      ) {
        advance();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, step, advance]);

  useEffect(() => {
    if (!visible || !step?.highlight || !stepVisibleOnPath(step, pathname)) {
      document.documentElement.removeAttribute("data-tutorial-highlight");
      document.documentElement.removeAttribute("data-tutorial-cue");
      return;
    }
    document.documentElement.setAttribute(
      "data-tutorial-highlight",
      step.highlight,
    );
    document.documentElement.setAttribute(
      "data-tutorial-cue",
      cueForHighlight(step.highlight),
    );
    return () => {
      document.documentElement.removeAttribute("data-tutorial-highlight");
      document.documentElement.removeAttribute("data-tutorial-cue");
    };
  }, [visible, step, pathname]);

  // Inside the world, hold the card back until the loader is gone.
  const worldStepNeedsReady =
    Boolean(
      step?.route?.startsWith("/dashboard/world") ||
        step?.targetRoute?.startsWith("/dashboard/world"),
    ) && pathname.startsWith("/dashboard/world");
  const onStepPath = Boolean(step && stepVisibleOnPath(step, pathname));
  const showOverlay =
    visible &&
    Boolean(step) &&
    onStepPath &&
    (!worldStepNeedsReady || world.worldReady);

  // Clear spotlight when the card is hidden (e.g. home after login).
  useEffect(() => {
    if (showOverlay) return;
    document.documentElement.removeAttribute("data-tutorial-highlight");
    document.documentElement.removeAttribute("data-tutorial-cue");
  }, [showOverlay]);

  const restart = useCallback(() => {
    if (!enabled) return;
    beginReplay();
  }, [enabled, beginReplay]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      active: showOverlay,
      enabled,
      step,
      restart,
      reportWorld,
      reportHackathonComplete,
      lockVisitsToVictor: Boolean(
        visible && step && (step.id === "visit-victor" || step.advance === "visit-victor"),
      ),
      lockQuestsToHackathon: Boolean(
        visible && step && (step.id === "quests-intro" || step.highlight === "hackathon-quest"),
      ),
    }),
    [
      showOverlay,
      enabled,
      step,
      restart,
      reportWorld,
      reportHackathonComplete,
      visible,
    ],
  );

  const skip = useCallback(() => finish(), [finish]);

  const nextManual = useCallback(() => {
    if (!step) return;
    if (step.advance === "manual") {
      if (stepIndex >= TUTORIAL_STEPS.length - 1) finish();
      else advance();
      return;
    }
    // Optional escape hatch on waiting steps (e.g. skip finishing the photo quest).
    if (step.advance === "hackathon-complete") {
      advance();
    }
  }, [advance, finish, step, stepIndex]);

  const goToHighlighted = useCallback(() => {
    if (!step?.goHref) return;
    if (
      (step.id === "exit-world" || step.id === "exit-visit") &&
      activeFriend
    ) {
      returnHome();
    }
    router.push(step.goHref);
  }, [router, step, activeFriend, returnHome]);

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {showOverlay && step ? (
        <TutorialOverlay
          step={step}
          stepIndex={stepIndex}
          stepCount={TUTORIAL_STEPS.length}
          exiting={exiting}
          pathname={pathname}
          onSkip={skip}
          onNext={nextManual}
          onGo={goToHighlighted}
        />
      ) : null}
    </TutorialContext.Provider>
  );
}

function TutorialOverlay({
  step,
  stepIndex,
  stepCount,
  exiting,
  pathname,
  onSkip,
  onNext,
  onGo,
}: {
  step: TutorialStep;
  stepIndex: number;
  stepCount: number;
  exiting: boolean;
  pathname: string;
  onSkip: () => void;
  onNext: () => void;
  onGo: () => void;
}) {
  const isLast = stepIndex >= stepCount - 1;
  const waiting = step.advance !== "manual";
  const offTargetRoute = Boolean(
    step.targetRoute && !pathMatches(pathname, step.targetRoute),
  );
  const showGo = Boolean(step.goHref) && offTargetRoute;
  const showManual = step.advance === "manual" && !showGo;
  const showContinueAnyway = step.advance === "hackathon-complete";
  const cardOnTop =
    step.highlight === "build-toggle" ||
    step.highlight === "build-catalog" ||
    step.highlight === "visit-victor" ||
    step.highlight === "hackathon-quest" ||
    Boolean(step.highlight?.startsWith("nav-"));

  const shellClass = pathname.startsWith("/dashboard/world")
    ? "tutorial-shell tutorial-shell-world"
    : "tutorial-shell tutorial-shell-dashboard";

  return (
    <>
      <div
        className={`tutorial-veil-layer${pathname.startsWith("/dashboard/world") ? " tutorial-veil-world" : " tutorial-veil-dashboard"}`}
        aria-hidden="true"
      />
      <div
        className={`${shellClass} tutorial-root${cardOnTop ? " tutorial-root-top" : ""}${exiting ? " tutorial-root-exit" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-body"
      >
        <div className="tutorial-card">
          <p className="tutorial-progress">
            {stepIndex + 1} / {stepCount}
          </p>
          <h2 id="tutorial-title" className="tutorial-title">
            {step.title}
          </h2>
          <p id="tutorial-body" className="tutorial-body">
            {step.body}
          </p>
          {waiting && !showGo && !showContinueAnyway ? (
            <p className="tutorial-wait" aria-live="polite">
              Waiting for you…
            </p>
          ) : null}
          {showContinueAnyway ? (
            <p className="tutorial-wait" aria-live="polite">
              Completes automatically when the quest finishes…
            </p>
          ) : null}
          <div className="tutorial-actions">
            <button type="button" className="tutorial-skip" onClick={onSkip}>
              Skip
            </button>
            {showGo ? (
              <button type="button" className="tutorial-next" onClick={onGo}>
                {step.goLabel ?? step.ctaLabel ?? "Go"}
              </button>
            ) : null}
            {showContinueAnyway ? (
              <button type="button" className="tutorial-next" onClick={onNext}>
                {step.ctaLabel ?? "Continue anyway"}
              </button>
            ) : null}
            {showManual ? (
              <button type="button" className="tutorial-next" onClick={onNext}>
                {step.ctaLabel ?? (isLast ? "Done" : "Next")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export function useTutorialControls() {
  const context = useContext(TutorialContext);
  return {
    enabled: context?.enabled ?? false,
    restart: context?.restart ?? (() => {}),
  };
}

export function useTutorialWorldReporter() {
  return useContext(TutorialContext)?.reportWorld ?? null;
}

export function useTutorialVisitLock() {
  return useContext(TutorialContext)?.lockVisitsToVictor ?? false;
}

export function useTutorialQuestLock() {
  return useContext(TutorialContext)?.lockQuestsToHackathon ?? false;
}

export function useTutorialHackathonReporter() {
  return useContext(TutorialContext)?.reportHackathonComplete ?? null;
}
