"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useSocialQuest } from "../SocialQuestProvider";

type ShopCategory = "SHIRT" | "HAT" | "SHOES" | "ACCESSORY";

interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  color: string;
  shade: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "maroon-shirt", name: "Campus Maroon", category: "SHIRT", price: 120, description: "A classic campus tee.", color: "#9f3652", shade: "#6d2238" },
  { id: "forest-shirt", name: "Forest Green", category: "SHIRT", price: 150, description: "Made for woodland quests.", color: "#4f824f", shade: "#315b38" },
  { id: "sky-shirt", name: "Sky Blue", category: "SHIRT", price: 150, description: "Bright as a clear campus day.", color: "#5c9fc4", shade: "#397396" },
  { id: "trail-cap", name: "Trail Cap", category: "HAT", price: 180, description: "Shade for long adventures.", color: "#bd7440", shade: "#7b4329" },
  { id: "knit-beanie", name: "Quest Beanie", category: "HAT", price: 220, description: "Cozy gear for late study runs.", color: "#6e4f92", shade: "#493568" },
  { id: "campus-runners", name: "Campus Runners", category: "SHOES", price: 140, description: "Reliable everyday shoes.", color: "#76503a", shade: "#4c3026" },
  { id: "gold-sneakers", name: "Gold Sneakers", category: "SHOES", price: 190, description: "A little shine for every step.", color: "#d49a39", shade: "#8f6227" },
  { id: "forest-sneakers", name: "Forest Sneakers", category: "SHOES", price: 190, description: "Earthy and ready to explore.", color: "#55724a", shade: "#354c32" },
  { id: "round-glasses", name: "Round Glasses", category: "ACCESSORY", price: 160, description: "A scholarly finishing touch.", color: "#d4ad52", shade: "#765324" },
  { id: "campus-pin", name: "Campus Pin", category: "ACCESSORY", price: 90, description: "Wear your campus pride.", color: "#f0c958", shade: "#a56e28" },
];

const FILTERS: Array<{ label: string; value: "ALL" | ShopCategory }> = [
  { label: "All items", value: "ALL" },
  { label: "Shirts", value: "SHIRT" },
  { label: "Hats", value: "HAT" },
  { label: "Shoes", value: "SHOES" },
  { label: "Accessories", value: "ACCESSORY" },
];

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  SHIRT: "Shirt",
  HAT: "Hat",
  SHOES: "Shoes",
  ACCESSORY: "Accessory",
};

type EquippedItems = Record<ShopCategory, string | null>;

function sameColor(data: Uint8ClampedArray, index: number, color: [number, number, number]) {
  return data[index] === color[0] && data[index + 1] === color[1] && data[index + 2] === color[2];
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function paintPixels(
  context: CanvasRenderingContext2D,
  pixels: Array<[number, number, number, number]>,
  color: string,
) {
  context.fillStyle = color;
  pixels.forEach(([x, y, width, height]) => context.fillRect(x, y, width, height));
}

function CharacterPreview({ equipped, playerName }: { equipped: EquippedItems; playerName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    const image = new Image();
    image.src = "/game/characters/student-shoes.png";
    image.onload = () => {
      context.clearRect(0, 0, 16, 16);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, 16, 16, 0, 0, 16, 16);

      const shirt = SHOP_ITEMS.find((item) => item.id === equipped.SHIRT);
      const shoes = SHOP_ITEMS.find((item) => item.id === equipped.SHOES);
      const pixels = context.getImageData(0, 0, 16, 16);

      for (let index = 0; index < pixels.data.length; index += 4) {
        if (shirt && sameColor(pixels.data, index, [192, 203, 220])) {
          pixels.data.set(hexToRgb(shirt.color), index);
        } else if (shirt && sameColor(pixels.data, index, [139, 155, 180])) {
          pixels.data.set(hexToRgb(shirt.shade), index);
        } else if (shoes && sameColor(pixels.data, index, [112, 68, 42])) {
          pixels.data.set(hexToRgb(shoes.color), index);
        } else if (shoes && sameColor(pixels.data, index, [72, 43, 32])) {
          pixels.data.set(hexToRgb(shoes.shade), index);
        }
      }

      context.putImageData(pixels, 0, 0);

      const hat = SHOP_ITEMS.find((item) => item.id === equipped.HAT);
      if (hat?.id === "trail-cap") {
        paintPixels(context, [[4, 0, 8, 2], [3, 2, 10, 2]], hat.color);
        paintPixels(context, [[11, 3, 3, 1], [4, 3, 7, 1]], hat.shade);
      }
      if (hat?.id === "knit-beanie") {
        paintPixels(context, [[6, 0, 4, 1], [4, 1, 8, 2], [3, 3, 10, 2]], hat.color);
        paintPixels(context, [[3, 4, 10, 1]], hat.shade);
      }

      const accessory = SHOP_ITEMS.find((item) => item.id === equipped.ACCESSORY);
      if (accessory?.id === "round-glasses") {
        paintPixels(context, [[4, 7, 3, 1], [9, 7, 3, 1], [3, 8, 1, 1], [7, 8, 2, 1], [12, 8, 1, 1]], accessory.shade);
      }
      if (accessory?.id === "campus-pin") {
        paintPixels(context, [[10, 11, 1, 1], [11, 12, 1, 1]], accessory.color);
      }
    };
  }, [equipped]);

  return (
    <canvas
      ref={canvasRef}
      className="shop-character-canvas"
      width="16"
      height="16"
      role="img"
      aria-label={`${playerName}'s character preview`}
    />
  );
}

function ItemArt({ item }: { item: ShopItem }) {
  const style = {
    "--shop-item-color": item.color,
    "--shop-item-shade": item.shade,
  } as CSSProperties;

  return (
    <span className={`shop-item-art shop-item-art-${item.category.toLowerCase()} shop-item-${item.id}`} style={style} aria-hidden="true">
      <i />
    </span>
  );
}

export default function ShopPage() {
  const { coins, player, setCoins } = useSocialQuest();
  const [filter, setFilter] = useState<"ALL" | ShopCategory>("ALL");
  const [owned, setOwned] = useState(() => new Set(["maroon-shirt", "campus-runners"]));
  const [equipped, setEquipped] = useState<EquippedItems>({
    SHIRT: "maroon-shirt",
    HAT: null,
    SHOES: "campus-runners",
    ACCESSORY: null,
  });
  const [notice, setNotice] = useState("Select an item to preview it on your character.");

  const visibleItems = useMemo(
    () => filter === "ALL" ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === filter),
    [filter],
  );

  const equipItem = (item: ShopItem) => {
    setEquipped((current) => ({ ...current, [item.category]: item.id }));
    setNotice(`${item.name} equipped.`);
  };

  const buyItem = (item: ShopItem) => {
    if (owned.has(item.id)) {
      equipItem(item);
      return;
    }

    if (coins < item.price) {
      setNotice(`You need ${item.price - coins} more coins for ${item.name}.`);
      return;
    }

    setCoins(coins - item.price);
    setOwned((current) => new Set(current).add(item.id));
    setEquipped((current) => ({ ...current, [item.category]: item.id }));
    setNotice(`${item.name} purchased and equipped!`);
  };

  return (
    <div className="dashboard-page shop-page">
      <section className="dashboard-page-heading shop-page-heading">
        <div>
          <span>Campus Outfitters</span>
          <h1>Character Shop</h1>
          <p>Spend the coins you earn from quests on a fresh campus look.</p>
        </div>
        <div className="shop-balance" aria-label={`${coins} coins available`}>
          <i className="dashboard-resource-icon dashboard-icon-coins" aria-hidden="true" />
          <span><small>Your balance</small><strong>{coins.toLocaleString()} coins</strong></span>
        </div>
      </section>

      <div className="shop-layout">
        <aside className="shop-preview-panel" aria-label="Character preview">
          <div className="shop-preview-heading">
            <span>Fitting room</span>
            <h2>{player.name}</h2>
          </div>
          <div className="shop-character-stage">
            <span className="shop-preview-spark shop-preview-spark-one" aria-hidden="true">✦</span>
            <span className="shop-preview-spark shop-preview-spark-two" aria-hidden="true">✦</span>
            <CharacterPreview equipped={equipped} playerName={player.name} />
            <span className="shop-character-shadow" aria-hidden="true" />
          </div>
          <div className="shop-equipped-list">
            {(Object.keys(CATEGORY_LABELS) as ShopCategory[]).map((category) => {
              const item = SHOP_ITEMS.find((entry) => entry.id === equipped[category]);
              return (
                <div key={category}>
                  <span>{CATEGORY_LABELS[category]}</span>
                  <strong>{item?.name ?? "None"}</strong>
                </div>
              );
            })}
          </div>
          <p className="shop-notice" aria-live="polite">{notice}</p>
        </aside>

        <section className="shop-catalog" aria-labelledby="shop-catalog-title">
          <div className="shop-catalog-heading">
            <div>
              <span>Simple styles</span>
              <h2 id="shop-catalog-title">Shop items</h2>
            </div>
            <span>{visibleItems.length} items</span>
          </div>

          <div className="shop-filters" aria-label="Filter shop items">
            {FILTERS.map((category) => (
              <button
                key={category.value}
                type="button"
                className={filter === category.value ? "shop-filter-active" : ""}
                onClick={() => setFilter(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="shop-item-grid">
            {visibleItems.map((item) => {
              const isOwned = owned.has(item.id);
              const isEquipped = equipped[item.category] === item.id;
              return (
                <article className={`shop-item-card ${isEquipped ? "shop-item-card-equipped" : ""}`} key={item.id}>
                  <ItemArt item={item} />
                  <div className="shop-item-copy">
                    <span>{CATEGORY_LABELS[item.category]}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="shop-item-footer">
                    <strong><i className="dashboard-resource-icon dashboard-icon-coins" aria-hidden="true" /> {item.price}</strong>
                    <button type="button" disabled={isEquipped} onClick={() => buyItem(item)}>
                      {isEquipped ? "Equipped" : isOwned ? "Equip" : "Buy"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
