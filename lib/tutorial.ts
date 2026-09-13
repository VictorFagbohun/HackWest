/** Multi-route campus tutorial: static script + client feature flags. */

export type TutorialAdvance =
  | "manual"
  | "move"
  | "build"
  | "select"
  | "place"
  | "inspect"
  | "route"
  | "visit-victor"
  | "hackathon-complete";

export type TutorialHighlight =
  | "build-toggle"
  | "build-catalog"
  | "canvas"
  | "world-exit"
  | "nav-world"
  | "nav-quests"
  | "nav-shop"
  | "nav-friends"
  | "nav-rankings"
  | "nav-profile"
  | "quests-panel"
  | "hackathon-quest"
  | "shop-catalog"
  | "visit-victor"
  | "rankings-panel"
  | "profile-card"
  | null;

export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  /** Spoken line for ElevenLabs later; keep in sync with body. */
  voiceText: string;
  advance: TutorialAdvance;
  highlight: TutorialHighlight;
  /** Preferred pathname for this step (prefix match). */
  route?: string;
  /** When advance is "route", wait until pathname matches this. */
  targetRoute?: string;
  /** Skip when the world is visit-only. */
  requiresEditable?: boolean;
  /** Only while visiting another campus. */
  requiresVisiting?: boolean;
  ctaLabel?: string;
  /** Label for goHref when the player is off the target route. */
  goLabel?: string;
  /** Optional primary CTA navigation. */
  goHref?: string;
};

export const TUTORIAL_STORAGE_KEY = "campus-quest-tutorial-done";
export const TUTORIAL_STEP_KEY = "campus-quest-tutorial-step";
export const VICTOR_FRIEND_ID = "victor";
/** Campus quest spotlighted during the tutorial. */
export const TUTORIAL_QUEST_LOCATION = "HACKATHON";

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to campus",
    body: "Enter the open world to begin. We will walk through building, then Quests, Shop, Friends, Rankings, and Profile.",
    voiceText:
      "Welcome to campus. Enter the open world to begin. We will walk through building, then Quests, Shop, Friends, Rankings, and Profile.",
    advance: "manual",
    highlight: "nav-world",
    targetRoute: "/dashboard/world",
    goHref: "/dashboard/world",
    ctaLabel: "Let's go",
    goLabel: "Enter Open World",
  },
  {
    id: "move",
    title: "Take a walk",
    body: "Use the arrow keys to move around the map.",
    voiceText: "Use the arrow keys to move around the map.",
    advance: "move",
    highlight: "canvas",
    route: "/dashboard/world",
  },
  {
    id: "build",
    title: "Open the builder",
    body: "Tap the glowing Build button in the bottom-right to open your catalog.",
    voiceText: "Tap the glowing Build button in the bottom right to open your catalog.",
    advance: "build",
    highlight: "build-toggle",
    route: "/dashboard/world",
    requiresEditable: true,
  },
  {
    id: "select",
    title: "Pick something",
    body: "Choose a building or decor item from the highlighted catalog.",
    voiceText: "Choose a building or decor item from the highlighted catalog.",
    advance: "select",
    highlight: "build-catalog",
    route: "/dashboard/world",
    requiresEditable: true,
  },
  {
    id: "place",
    title: "Place it",
    body: "Click an empty tile on the map to place your selection.",
    voiceText: "Click an empty tile on the map to place your selection.",
    advance: "place",
    highlight: "canvas",
    route: "/dashboard/world",
    requiresEditable: true,
  },
  {
    id: "inspect",
    title: "Inspect nearby",
    body: "Walk near a building or decor, then press E to inspect it.",
    voiceText: "Walk near a building or decor, then press E to inspect it.",
    advance: "inspect",
    highlight: "canvas",
    route: "/dashboard/world",
  },
  {
    id: "exit-world",
    title: "Leave the world",
    body: "Head back to the dashboard so we can tour Quests, Shop, Friends, and more.",
    voiceText:
      "Head back to the dashboard so we can tour Quests, Shop, Friends, and more.",
    advance: "route",
    highlight: "world-exit",
    route: "/dashboard/world",
    targetRoute: "/dashboard",
    goHref: "/dashboard",
    ctaLabel: "Exit world",
  },
  {
    id: "open-quests",
    title: "Open Quests",
    body: "Click Quests in the left sidebar to see campus challenges.",
    voiceText: "Click Quests in the left sidebar to see campus challenges.",
    advance: "route",
    highlight: "nav-quests",
    targetRoute: "/dashboard/quests",
    goHref: "/dashboard/quests",
    ctaLabel: "Open Quests",
  },
  {
    id: "quests-intro",
    title: "Try the Hackathon quest",
    body: "Start Hackathon Check-in at the top, then submit a photo. This step moves on automatically when it completes.",
    voiceText:
      "Start Hackathon Check-in at the top, then submit a photo. This step moves on automatically when it completes.",
    advance: "hackathon-complete",
    highlight: "hackathon-quest",
    route: "/dashboard/quests",
    ctaLabel: "Continue anyway",
  },
  {
    id: "open-shop",
    title: "Visit the Shop",
    body: "Click Shop in the sidebar to outfit your character.",
    voiceText: "Click Shop in the sidebar to outfit your character.",
    advance: "route",
    highlight: "nav-shop",
    targetRoute: "/dashboard/shop",
    goHref: "/dashboard/shop",
    ctaLabel: "Open Shop",
  },
  {
    id: "shop-intro",
    title: "Spend your coins",
    body: "Preview gear on your character, then buy and equip items with coins you earn from quests.",
    voiceText:
      "Preview gear on your character, then buy and equip items with coins you earn from quests.",
    advance: "manual",
    highlight: "shop-catalog",
    route: "/dashboard/shop",
    ctaLabel: "Next",
  },
  {
    id: "open-friends",
    title: "Find friends",
    body: "Click Friends to see classmates you can visit.",
    voiceText: "Click Friends to see classmates you can visit.",
    advance: "route",
    highlight: "nav-friends",
    targetRoute: "/dashboard/friends",
    goHref: "/dashboard/friends",
    ctaLabel: "Open Friends",
  },
  {
    id: "visit-victor",
    title: "Visit Victor's map",
    body: "Click Visit next to Victor Fagbohun to explore his campus in visit-only mode.",
    voiceText:
      "Click Visit next to Victor Fagbohun to explore his campus in visit-only mode.",
    advance: "visit-victor",
    highlight: "visit-victor",
    route: "/dashboard/friends",
  },
  {
    id: "victor-map",
    title: "Victor's campus",
    body: "You are visiting Victor's map. You can walk and inspect, but you cannot edit his world.",
    voiceText:
      "You are visiting Victor's map. You can walk and inspect, but you cannot edit his world.",
    advance: "manual",
    highlight: "canvas",
    route: "/dashboard/world",
    requiresVisiting: true,
    ctaLabel: "Got it",
  },
  {
    id: "exit-visit",
    title: "Head back",
    body: "Leave Victor's campus and return to the dashboard.",
    voiceText: "Leave Victor's campus and return to the dashboard.",
    advance: "route",
    highlight: "world-exit",
    route: "/dashboard/world",
    targetRoute: "/dashboard",
    goHref: "/dashboard",
    ctaLabel: "Exit world",
  },
  {
    id: "open-rankings",
    title: "Check Rankings",
    body: "Click Rankings to see the weekly XP leaderboard.",
    voiceText: "Click Rankings to see the weekly XP leaderboard.",
    advance: "route",
    highlight: "nav-rankings",
    targetRoute: "/dashboard/rankings",
    goHref: "/dashboard/rankings",
    ctaLabel: "Open Rankings",
  },
  {
    id: "rankings-intro",
    title: "Weekly board",
    body: "Climb the board by completing quests and earning XP this week.",
    voiceText: "Climb the board by completing quests and earning XP this week.",
    advance: "manual",
    highlight: "rankings-panel",
    route: "/dashboard/rankings",
    ctaLabel: "Next",
  },
  {
    id: "open-profile",
    title: "Your Profile",
    body: "Click Profile to see your explorer card and path stats.",
    voiceText: "Click Profile to see your explorer card and path stats.",
    advance: "route",
    highlight: "nav-profile",
    targetRoute: "/dashboard/profile",
    goHref: "/dashboard/profile",
    ctaLabel: "Open Profile",
  },
  {
    id: "profile-done",
    title: "You're set",
    body: "That is the full loop — world, quests, shop, friends, rankings, and profile. Go explore.",
    voiceText:
      "That is the full loop — world, quests, shop, friends, rankings, and profile. Go explore.",
    advance: "manual",
    highlight: "profile-card",
    route: "/dashboard/profile",
    ctaLabel: "Start exploring",
  },
];

export function isTutorialEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_TUTORIAL_ENABLED;
  return value === "1" || value === "true";
}

export function isTutorialVoiceEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_TUTORIAL_VOICE;
  return value === "1" || value === "true";
}

export function stepsForContext(options: {
  editable: boolean;
  visiting: boolean;
}): TutorialStep[] {
  return TUTORIAL_STEPS.filter((step) => {
    if (step.requiresEditable && !options.editable) return false;
    if (step.requiresVisiting && !options.visiting) return false;
    return true;
  });
}

export function readTutorialCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeTutorialCompleted(done: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (done) {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
      window.sessionStorage.removeItem(TUTORIAL_STEP_KEY);
    } else {
      window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    }
  } catch {
    // Ignore private-mode / quota failures.
  }
}

export function readTutorialStepId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TUTORIAL_STEP_KEY);
  } catch {
    return null;
  }
}

export function writeTutorialStepId(stepId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TUTORIAL_STEP_KEY, stepId);
  } catch {
    // Ignore storage failures.
  }
}

/**
 * `?tutorial=1` is dropped when an unauthenticated hit bounces through Auth0,
 * so middleware mirrors it into this cookie for the client to pick up.
 */
export const TUTORIAL_REPLAY_COOKIE = "campus-quest-tutorial-replay";

function hasReplayCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((entry) => entry.trim() === `${TUTORIAL_REPLAY_COOKIE}=1`);
}

export function clearTutorialReplayCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TUTORIAL_REPLAY_COOKIE}=; path=/; max-age=0`;
}

export function shouldForceTutorialReplay(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("tutorial") === "1") {
      return true;
    }
  } catch {
    // Ignore malformed search strings.
  }
  return hasReplayCookie();
}

export function pathMatches(pathname: string, target: string): boolean {
  if (target === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === target || pathname.startsWith(`${target}/`);
}

/** Only show the coach card on the page that step belongs to. */
export function stepVisibleOnPath(step: TutorialStep, pathname: string): boolean {
  if (step.route) {
    if (step.route.startsWith("/dashboard/world")) {
      return pathname.startsWith("/dashboard/world");
    }
    return pathMatches(pathname, step.route);
  }

  // Manual steps that deep-link somewhere (e.g. welcome → world): show off-target
  // on the dashboard shell, and on-target once the player arrives.
  if (step.goHref && step.advance === "manual" && step.targetRoute) {
    if (pathMatches(pathname, step.targetRoute)) return true;
    return (
      pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/dashboard/world")
    );
  }

  // Sidebar guidance steps (Open Quests / Shop / …) stay on the dashboard shell.
  if (step.advance === "route" || step.goHref) {
    return (
      pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/dashboard/world")
    );
  }
  return pathname.startsWith("/dashboard");
}

const MOVE_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export function isMoveKey(code: string): boolean {
  return MOVE_KEYS.has(code);
}

export type TutorialWorldSignals = {
  editable: boolean;
  buildMode: boolean;
  selectedCatalogId: string | null;
  objectCount: number;
  prompt: string | null;
  worldReady: boolean;
};
