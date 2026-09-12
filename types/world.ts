export type WorldObjectKind = "building" | "decor";

export interface TilePoint {
  x: number;
  y: number;
}

export interface WorldObject {
  id: string;
  catalogId: string;
  kind: WorldObjectKind;
  x: number;
  y: number;
}

export interface WorldData {
  id: string;
  name?: string;
  mapKey: "campus";
  spawn: TilePoint;
  objects: WorldObject[];
}

export interface CatalogItem {
  id: string;
  name: string;
  kind: WorldObjectKind;
  cost: number;
  width: number;
  height: number;
  textureKey: string;
  interactLabel?: string;
}

export interface GameWorldProps {
  world: WorldData;
  coins: number;
  editable: boolean;
  playerName: string;
  onWorldChange?: (world: WorldData) => void;
  onCoinsChange?: (coins: number) => void;
}

export const TILE_SIZE = 16;

export const CATALOG: CatalogItem[] = [
  {
    id: "library",
    name: "Library",
    kind: "building",
    cost: 400,
    width: 4,
    height: 3,
    textureKey: "building-library",
    interactLabel: "Library — a quiet place to study",
  },
  {
    id: "gym",
    name: "Gym",
    kind: "building",
    cost: 350,
    width: 3,
    height: 3,
    textureKey: "building-gym",
    interactLabel: "Gym — train and recharge",
  },
  {
    id: "org-hall",
    name: "Org Hall",
    kind: "building",
    cost: 320,
    width: 3,
    height: 3,
    textureKey: "building-org-hall",
    interactLabel: "Org Hall — clubs and student orgs",
  },
  {
    id: "career",
    name: "Career Center",
    kind: "building",
    cost: 320,
    width: 3,
    height: 3,
    textureKey: "building-career",
    interactLabel: "Career Center — events and internships",
  },
  {
    id: "tree-pine",
    name: "Pine",
    kind: "decor",
    cost: 40,
    width: 1,
    height: 2,
    textureKey: "decor-tree-pine",
  },
  {
    id: "tree-round",
    name: "Oak",
    kind: "decor",
    cost: 50,
    width: 2,
    height: 2,
    textureKey: "decor-tree-round",
  },
  {
    id: "tree-autumn",
    name: "Autumn Tree",
    kind: "decor",
    cost: 45,
    width: 1,
    height: 2,
    textureKey: "decor-tree-autumn",
  },
  {
    id: "bush",
    name: "Bush",
    kind: "decor",
    cost: 20,
    width: 1,
    height: 1,
    textureKey: "decor-bush",
  },
  {
    id: "flowers",
    name: "Flowers",
    kind: "decor",
    cost: 15,
    width: 1,
    height: 1,
    textureKey: "decor-flowers",
  },
  {
    id: "bench",
    name: "Bench",
    kind: "decor",
    cost: 60,
    width: 1,
    height: 1,
    textureKey: "decor-bench",
    interactLabel: "A sunny bench",
  },
  {
    id: "lamp",
    name: "Lamp",
    kind: "decor",
    cost: 70,
    width: 1,
    height: 1,
    textureKey: "decor-lamp",
  },
  {
    id: "mushrooms",
    name: "Mushrooms",
    kind: "decor",
    cost: 15,
    width: 1,
    height: 1,
    textureKey: "decor-mushrooms",
  },
];

export const catalogById = Object.fromEntries(
  CATALOG.map((item) => [item.id, item]),
) as Record<string, CatalogItem>;

export function createStarterWorld(): WorldData {
  return {
    id: "campus-starter",
    name: "West Quad",
    mapKey: "campus",
    spawn: { x: 24, y: 20 },
    objects: [
      { id: "b-library", catalogId: "library", kind: "building", x: 20, y: 6 },
      { id: "b-gym", catalogId: "gym", kind: "building", x: 33, y: 14 },
      { id: "b-org", catalogId: "org-hall", kind: "building", x: 7, y: 13 },
      { id: "b-career", catalogId: "career", kind: "building", x: 18, y: 24 },
      { id: "d-pine-1", catalogId: "tree-pine", kind: "decor", x: 5, y: 4 },
      { id: "d-pine-2", catalogId: "tree-pine", kind: "decor", x: 8, y: 3 },
      { id: "d-oak-1", catalogId: "tree-round", kind: "decor", x: 41, y: 11 },
      { id: "d-oak-2", catalogId: "tree-round", kind: "decor", x: 3, y: 27 },
      { id: "d-autumn-1", catalogId: "tree-autumn", kind: "decor", x: 40, y: 27 },
      { id: "d-bush-1", catalogId: "bush", kind: "decor", x: 16, y: 15 },
      { id: "d-bush-2", catalogId: "bush", kind: "decor", x: 30, y: 16 },
      { id: "d-flowers-1", catalogId: "flowers", kind: "decor", x: 22, y: 15 },
      { id: "d-flowers-2", catalogId: "flowers", kind: "decor", x: 27, y: 21 },
      { id: "d-bench-1", catalogId: "bench", kind: "decor", x: 21, y: 19 },
      { id: "d-bench-2", catalogId: "bench", kind: "decor", x: 27, y: 19 },
      { id: "d-lamp-1", catalogId: "lamp", kind: "decor", x: 20, y: 17 },
      { id: "d-lamp-2", catalogId: "lamp", kind: "decor", x: 28, y: 17 },
      { id: "d-shroom-1", catalogId: "mushrooms", kind: "decor", x: 38, y: 11 },
    ],
  };
}
