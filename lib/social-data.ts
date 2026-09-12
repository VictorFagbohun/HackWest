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

export const FRIENDS: FriendProfile[] = [
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
  { id: "maya", name: "Maya Chen", initials: "MC", xp: 1840, level: 12 },
  { id: "jordan", name: "Jordan Ellis", initials: "JE", xp: 1510, level: 10 },
  { id: "priya", name: "Priya Shah", initials: "PS", xp: 1260, level: 8 },
  { id: "sam", name: "Sam Wilson", initials: "SW", xp: 720, level: 5 },
];
