export type QuestCategory = "SCHOLAR" | "WELLNESS" | "COMMUNITY" | "CAREER";

export interface PlayerProfile {
  id: string;
  name: string;
  university: string;
  major: string;
  level: number;
  xp: number;
  coins: number;
  character: Record<string, string>;
  stats: {
    knowledge: number;
    wellness: number;
    community: number;
    career: number;
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  xp_reward: number;
  coin_reward: number;
  location_code: string | null;
  frequency: "DAILY" | "ONE_TIME" | "REPEATABLE";
}

export const playerProfile: PlayerProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Daniel",
  university: "Texas Tech University",
  major: "Computer Science",
  level: 4,
  xp: 780,
  coins: 1500,
  character: { sprite: "student-shoes" },
  stats: {
    knowledge: 72,
    wellness: 54,
    community: 63,
    career: 41,
  },
};

export const quests: Quest[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    title: "Scholar's Journey",
    description: "Complete a focused study session at the library.",
    category: "SCHOLAR",
    xp_reward: 120,
    coin_reward: 45,
    location_code: "LIBRARY_MAIN",
    frequency: "DAILY",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    title: "Move Your Body",
    description: "Spend thirty minutes moving at the recreation center.",
    category: "WELLNESS",
    xp_reward: 100,
    coin_reward: 35,
    location_code: "REC_CENTER",
    frequency: "DAILY",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    title: "Campus Connection",
    description: "Attend a student organization event on campus.",
    category: "COMMUNITY",
    xp_reward: 150,
    coin_reward: 55,
    location_code: "ORG_HALL",
    frequency: "REPEATABLE",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    title: "Career Launchpad",
    description: "Review an internship or visit the career center.",
    category: "CAREER",
    xp_reward: 175,
    coin_reward: 60,
    location_code: "CAREER_CENTER",
    frequency: "ONE_TIME",
  },
];

export const categoryLabels: Record<QuestCategory, string> = {
  SCHOLAR: "Scholar",
  WELLNESS: "Wellness",
  COMMUNITY: "Community",
  CAREER: "Career",
};
