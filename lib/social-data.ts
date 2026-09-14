import type { FriendProfile, LeaderboardPlayer, Quest } from "@/types/social";
import { createStarterWorld, type WorldData } from "@/types/world";

export const QUESTS: Quest[] = [
  {
    id: "campus-foundation",
    title: "Campus Foundations",
    description: "Have four buildings on your campus.",
    category: "Campus",
    goal: 4,
    rewardCoins: 100,
    rewardXp: 80,
  },
  {
    id: "campus-creator",
    title: "Campus Creator",
    description: "Place two new items in your world.",
    category: "Daily",
    goal: 2,
    rewardCoins: 150,
    rewardXp: 120,
  },
  {
    id: "friendly-neighbor",
    title: "Friendly Neighbor",
    description: "Visit two different friends' campuses.",
    category: "Social",
    goal: 2,
    rewardCoins: 125,
    rewardXp: 100,
  },
];

function makeFriendWorld(
  id: string,
  name: string,
  omittedIds: string[],
  extraObjects: WorldData["objects"],
): WorldData {
  const starter = createStarterWorld();
  return {
    ...starter,
    id,
    name,
    objects: [
      ...starter.objects.filter((object) => !omittedIds.includes(object.id)),
      ...extraObjects,
    ],
  };
}

/** Lived-in demo campus for visiting Victor during showcases. */
export function createVictorWorld(): WorldData {
  const buildings: WorldData["objects"] = [
    // North strip
    { id: "v-b01", catalogId: "library", kind: "building", x: 1, y: 1 },
    { id: "v-b02", catalogId: "gym", kind: "building", x: 6, y: 1 },
    { id: "v-b03", catalogId: "org-hall", kind: "building", x: 10, y: 1 },
    { id: "v-b04", catalogId: "career", kind: "building", x: 14, y: 1 },
    { id: "v-b05", catalogId: "library", kind: "building", x: 26, y: 1 },
    { id: "v-b06", catalogId: "gym", kind: "building", x: 31, y: 1 },
    { id: "v-b07", catalogId: "org-hall", kind: "building", x: 35, y: 1 },
    { id: "v-b08", catalogId: "career", kind: "building", x: 39, y: 1 },
    { id: "v-b09", catalogId: "library", kind: "building", x: 43, y: 1 },

    // Upper mid
    { id: "v-b10", catalogId: "gym", kind: "building", x: 1, y: 5 },
    { id: "v-b11", catalogId: "career", kind: "building", x: 5, y: 5 },
    { id: "v-b12", catalogId: "org-hall", kind: "building", x: 9, y: 5 },
    { id: "v-b13", catalogId: "library", kind: "building", x: 26, y: 5 },
    { id: "v-b14", catalogId: "gym", kind: "building", x: 31, y: 5 },
    { id: "v-b15", catalogId: "org-hall", kind: "building", x: 35, y: 5 },
    { id: "v-b16", catalogId: "career", kind: "building", x: 39, y: 5 },
    { id: "v-b17", catalogId: "library", kind: "building", x: 43, y: 5 },

    // West wing
    { id: "v-b18", catalogId: "library", kind: "building", x: 1, y: 9 },
    { id: "v-b19", catalogId: "gym", kind: "building", x: 1, y: 13 },
    { id: "v-b20", catalogId: "org-hall", kind: "building", x: 1, y: 17 },
    { id: "v-b21", catalogId: "career", kind: "building", x: 1, y: 21 },
    { id: "v-b22", catalogId: "library", kind: "building", x: 1, y: 25 },
    { id: "v-b23", catalogId: "gym", kind: "building", x: 1, y: 29 },
    { id: "v-b24", catalogId: "org-hall", kind: "building", x: 5, y: 9 },
    { id: "v-b25", catalogId: "career", kind: "building", x: 5, y: 17 },
    { id: "v-b26", catalogId: "library", kind: "building", x: 5, y: 25 },
    { id: "v-b27", catalogId: "gym", kind: "building", x: 5, y: 29 },

    // East wing
    { id: "v-b28", catalogId: "library", kind: "building", x: 39, y: 9 },
    { id: "v-b29", catalogId: "gym", kind: "building", x: 43, y: 9 },
    { id: "v-b30", catalogId: "org-hall", kind: "building", x: 39, y: 13 },
    { id: "v-b31", catalogId: "career", kind: "building", x: 43, y: 13 },
    { id: "v-b32", catalogId: "library", kind: "building", x: 39, y: 17 },
    { id: "v-b33", catalogId: "gym", kind: "building", x: 43, y: 17 },
    { id: "v-b34", catalogId: "org-hall", kind: "building", x: 39, y: 21 },
    { id: "v-b35", catalogId: "career", kind: "building", x: 43, y: 21 },
    { id: "v-b36", catalogId: "library", kind: "building", x: 39, y: 25 },
    { id: "v-b37", catalogId: "gym", kind: "building", x: 43, y: 25 },
    { id: "v-b38", catalogId: "org-hall", kind: "building", x: 39, y: 29 },
    { id: "v-b39", catalogId: "career", kind: "building", x: 43, y: 29 },

    // South strip
    { id: "v-b40", catalogId: "library", kind: "building", x: 9, y: 29 },
    { id: "v-b41", catalogId: "gym", kind: "building", x: 13, y: 29 },
    { id: "v-b42", catalogId: "org-hall", kind: "building", x: 17, y: 29 },
    { id: "v-b43", catalogId: "career", kind: "building", x: 21, y: 29 },
    { id: "v-b44", catalogId: "library", kind: "building", x: 25, y: 29 },
    { id: "v-b45", catalogId: "gym", kind: "building", x: 29, y: 29 },
    { id: "v-b46", catalogId: "org-hall", kind: "building", x: 33, y: 29 },

    // Inner ring around plaza (keep spawn ~24,20 walkable)
    { id: "v-b47", catalogId: "career", kind: "building", x: 10, y: 10 },
    { id: "v-b48", catalogId: "gym", kind: "building", x: 14, y: 10 },
    { id: "v-b49", catalogId: "org-hall", kind: "building", x: 28, y: 10 },
    { id: "v-b50", catalogId: "library", kind: "building", x: 32, y: 10 },
    { id: "v-b51", catalogId: "gym", kind: "building", x: 10, y: 14 },
    { id: "v-b52", catalogId: "career", kind: "building", x: 32, y: 14 },
    { id: "v-b53", catalogId: "org-hall", kind: "building", x: 10, y: 21 },
    { id: "v-b54", catalogId: "library", kind: "building", x: 14, y: 21 },
    { id: "v-b55", catalogId: "gym", kind: "building", x: 28, y: 21 },
    { id: "v-b56", catalogId: "career", kind: "building", x: 32, y: 21 },
    { id: "v-b57", catalogId: "library", kind: "building", x: 10, y: 25 },
    { id: "v-b58", catalogId: "org-hall", kind: "building", x: 14, y: 25 },
    { id: "v-b59", catalogId: "career", kind: "building", x: 28, y: 25 },
    { id: "v-b60", catalogId: "gym", kind: "building", x: 32, y: 25 },
  ];

  const decor: WorldData["objects"] = [
    // Light plaza edge only — keep the center open for walking
    { id: "v-sign", catalogId: "sign", kind: "decor", x: 24, y: 12 },
    { id: "v-well", catalogId: "well", kind: "decor", x: 18, y: 14 },
    { id: "v-well-2", catalogId: "well", kind: "decor", x: 30, y: 14 },
    { id: "v-bench-1", catalogId: "bench", kind: "decor", x: 19, y: 16 },
    { id: "v-bench-2", catalogId: "bench", kind: "decor", x: 29, y: 16 },
    { id: "v-bench-3", catalogId: "bench", kind: "decor", x: 19, y: 22 },
    { id: "v-bench-4", catalogId: "bench", kind: "decor", x: 29, y: 22 },
    { id: "v-lamp-1", catalogId: "lamp", kind: "decor", x: 20, y: 13 },
    { id: "v-lamp-2", catalogId: "lamp", kind: "decor", x: 28, y: 13 },
    { id: "v-lamp-3", catalogId: "lamp", kind: "decor", x: 20, y: 23 },
    { id: "v-lamp-4", catalogId: "lamp", kind: "decor", x: 28, y: 23 },
    { id: "v-oak-1", catalogId: "tree-round", kind: "decor", x: 17, y: 12 },
    { id: "v-oak-2", catalogId: "tree-round", kind: "decor", x: 29, y: 12 },
    { id: "v-pine-1", catalogId: "tree-pine", kind: "decor", x: 17, y: 24 },
    { id: "v-pine-2", catalogId: "tree-pine", kind: "decor", x: 30, y: 24 },
    { id: "v-fl-1", catalogId: "flowers", kind: "decor", x: 18, y: 13 },
    { id: "v-fl-2", catalogId: "flowers", kind: "decor", x: 30, y: 13 },
    { id: "v-bush-1", catalogId: "bush", kind: "decor", x: 18, y: 23 },
    { id: "v-bush-2", catalogId: "bush", kind: "decor", x: 30, y: 23 },
  ];

  // Drop starter buildings + starter plaza clutter so the center stays walkable.
  return makeFriendWorld(
    "victor-campus",
    "Fagbohun Commons",
    [
      "b-library",
      "b-gym",
      "b-org",
      "b-career",
      "d-bush-1",
      "d-bush-2",
      "d-bush-3",
      "d-flowers-1",
      "d-flowers-2",
      "d-wild-1",
      "d-wild-2",
      "d-wild-3",
      "d-bench-1",
      "d-bench-2",
      "d-lamp-1",
      "d-lamp-2",
      "d-sign-1",
    ],
    [...buildings, ...decor],
  );
}

export const FRIENDS: FriendProfile[] = [
  {
    id: "victor",
    name: "Victor Fagbohun",
    initials: "VF",
    major: "Computer Science",
    level: 14,
    xp: 2140,
    status: "online",
    lastSeen: "Building campus now",
    world: createVictorWorld(),
  },
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    major: "Computer Science",
    level: 12,
    xp: 1840,
    status: "online",
    lastSeen: "Exploring now",
    world: makeFriendWorld("maya-campus", "Maya's Garden", ["b-gym"], [
      { id: "maya-tree", catalogId: "tree-autumn", kind: "decor", x: 34, y: 14 },
      { id: "maya-flowers", catalogId: "flowers", kind: "decor", x: 35, y: 16 },
    ]),
  },
  {
    id: "jordan",
    name: "Jordan Ellis",
    initials: "JE",
    major: "Business",
    level: 10,
    xp: 1510,
    status: "away",
    lastSeen: "15 minutes ago",
    world: makeFriendWorld("jordan-campus", "Jordan's Commons", ["b-library"], [
      { id: "jordan-gym", catalogId: "gym", kind: "building", x: 15, y: 6 },
      { id: "jordan-bench", catalogId: "bench", kind: "decor", x: 30, y: 12 },
    ]),
  },
  {
    id: "priya",
    name: "Priya Shah",
    initials: "PS",
    major: "Architecture",
    level: 8,
    xp: 1260,
    status: "offline",
    lastSeen: "Yesterday",
    world: makeFriendWorld("priya-campus", "Priya's Quad", ["b-career"], [
      { id: "priya-oak", catalogId: "tree-round", kind: "decor", x: 19, y: 25 },
      { id: "priya-lamp", catalogId: "lamp", kind: "decor", x: 22, y: 25 },
    ]),
  },
];

export const LEADERBOARD_PLAYERS: LeaderboardPlayer[] = [
  { id: "alex", name: "Alex Rivera", initials: "AR", xp: 2380, level: 15 },
  { id: "victor", name: "Victor Fagbohun", initials: "VF", xp: 2140, level: 14 },
  { id: "maya", name: "Maya Chen", initials: "MC", xp: 1840, level: 12 },
  { id: "jordan", name: "Jordan Ellis", initials: "JE", xp: 1510, level: 10 },
  { id: "priya", name: "Priya Shah", initials: "PS", xp: 1260, level: 8 },
  { id: "sam", name: "Sam Wilson", initials: "SW", xp: 720, level: 5 },
];
