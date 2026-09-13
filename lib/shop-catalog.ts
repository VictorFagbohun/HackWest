export type ShopCategory = "SHIRT" | "HAT" | "SHOES" | "ACCESSORY";

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  color: string;
  shade: string;
}

export type EquippedItems = Record<ShopCategory, string | null>;

export interface CharacterOutfit {
  ownedItemIds: string[];
  equipped: EquippedItems;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "maroon-shirt",
    name: "Campus Maroon",
    category: "SHIRT",
    price: 120,
    description: "A classic campus tee.",
    color: "#9f3652",
    shade: "#6d2238",
  },
  {
    id: "forest-shirt",
    name: "Forest Green",
    category: "SHIRT",
    price: 150,
    description: "Made for woodland quests.",
    color: "#4f824f",
    shade: "#315b38",
  },
  {
    id: "sky-shirt",
    name: "Sky Blue",
    category: "SHIRT",
    price: 150,
    description: "Bright as a clear campus day.",
    color: "#5c9fc4",
    shade: "#397396",
  },
  {
    id: "trail-cap",
    name: "Trail Cap",
    category: "HAT",
    price: 180,
    description: "Shade for long adventures.",
    color: "#bd7440",
    shade: "#7b4329",
  },
  {
    id: "knit-beanie",
    name: "Quest Beanie",
    category: "HAT",
    price: 220,
    description: "Cozy gear for late study runs.",
    color: "#6e4f92",
    shade: "#493568",
  },
  {
    id: "campus-runners",
    name: "Campus Runners",
    category: "SHOES",
    price: 140,
    description: "Reliable everyday shoes.",
    color: "#76503a",
    shade: "#4c3026",
  },
  {
    id: "gold-sneakers",
    name: "Gold Sneakers",
    category: "SHOES",
    price: 190,
    description: "A little shine for every step.",
    color: "#d49a39",
    shade: "#8f6227",
  },
  {
    id: "forest-sneakers",
    name: "Forest Sneakers",
    category: "SHOES",
    price: 190,
    description: "Earthy and ready to explore.",
    color: "#55724a",
    shade: "#354c32",
  },
  {
    id: "round-glasses",
    name: "Round Glasses",
    category: "ACCESSORY",
    price: 160,
    description: "A scholarly finishing touch.",
    color: "#d4ad52",
    shade: "#765324",
  },
  {
    id: "campus-pin",
    name: "Campus Pin",
    category: "ACCESSORY",
    price: 90,
    description: "Wear your campus pride.",
    color: "#f0c958",
    shade: "#a56e28",
  },
];

export const SHOP_ITEM_BY_ID = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item]),
) as Record<string, ShopItem>;

export const SHOP_ITEM_IDS = new Set(SHOP_ITEMS.map((item) => item.id));

export const DEFAULT_OUTFIT: CharacterOutfit = {
  ownedItemIds: ["maroon-shirt", "campus-runners"],
  equipped: {
    SHIRT: "maroon-shirt",
    HAT: null,
    SHOES: "campus-runners",
    ACCESSORY: null,
  },
};

export const SHOP_FILTERS: Array<{ label: string; value: "ALL" | ShopCategory }> = [
  { label: "All Items", value: "ALL" },
  { label: "Shirts", value: "SHIRT" },
  { label: "Hats", value: "HAT" },
  { label: "Shoes", value: "SHOES" },
  { label: "Accessories", value: "ACCESSORY" },
];

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  SHIRT: "Shirt",
  HAT: "Hat",
  SHOES: "Shoes",
  ACCESSORY: "Accessory",
};

export function normalizeOutfit(input: CharacterOutfit | null | undefined): CharacterOutfit {
  const owned = new Set(DEFAULT_OUTFIT.ownedItemIds);
  for (const id of input?.ownedItemIds ?? []) {
    if (SHOP_ITEM_IDS.has(id)) owned.add(id);
  }

  const equipped: EquippedItems = { ...DEFAULT_OUTFIT.equipped };
  for (const category of Object.keys(equipped) as ShopCategory[]) {
    const itemId = input?.equipped?.[category] ?? null;
    if (itemId && owned.has(itemId) && SHOP_ITEM_BY_ID[itemId]?.category === category) {
      equipped[category] = itemId;
    } else if (itemId === null && input?.equipped && category in input.equipped) {
      equipped[category] = null;
    }
  }

  // Keep starter gear equipped when nothing valid is stored for that slot.
  if (!equipped.SHIRT && owned.has("maroon-shirt")) equipped.SHIRT = "maroon-shirt";
  if (!equipped.SHOES && owned.has("campus-runners")) equipped.SHOES = "campus-runners";

  return {
    ownedItemIds: [...owned],
    equipped,
  };
}
