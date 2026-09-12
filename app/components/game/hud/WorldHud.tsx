"use client";

import { CATALOG, type CatalogItem } from "@/types/world";

interface WorldHudProps {
  playerName: string;
  coins: number;
  editable: boolean;
  buildMode: boolean;
  selectedCatalogId: string | null;
  prompt: string | null;
  onToggleBuild: () => void;
  onSelectItem: (item: CatalogItem) => void;
}

export function WorldHud({
  playerName,
  coins,
  editable,
  buildMode,
  selectedCatalogId,
  prompt,
  onToggleBuild,
  onSelectItem,
}: WorldHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded border-2 border-amber-800/80 bg-[#1a140fd9] px-3 py-2 text-amber-100 shadow-lg">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">
            Explorer
          </p>
          <p className="text-lg leading-tight">{playerName}</p>
        </div>
        <div className="rounded border-2 border-yellow-700/80 bg-[#1a140fd9] px-3 py-2 text-yellow-200 shadow-lg">
          <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-100/70">
            Coins
          </p>
          <p className="text-lg leading-tight">{coins}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {prompt ? (
          <div className="mx-auto rounded border-2 border-emerald-800 bg-[#102016e6] px-3 py-2 text-center text-sm text-emerald-100">
            {prompt}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <p className="text-[11px] text-amber-100/80">
            Move with WASD / arrows
            {editable ? " · Build to place · E inspect · Del remove" : " · E inspect"}
          </p>
          {editable ? (
            <button
              type="button"
              onClick={onToggleBuild}
              className="pointer-events-auto rounded border-2 border-amber-700 bg-[#2a1b10] px-3 py-1.5 text-sm text-amber-100 hover:bg-[#3a2616]"
            >
              {buildMode ? "Explore" : "Build"}
            </button>
          ) : (
            <span className="rounded border-2 border-stone-600 bg-[#141414cc] px-3 py-1.5 text-sm text-stone-300">
              Visit only
            </span>
          )}
        </div>

        {editable && buildMode ? (
          <div className="pointer-events-auto flex gap-2 overflow-x-auto rounded border-2 border-amber-900 bg-[#1a140fee] p-2">
            {CATALOG.map((item) => {
              const selected = selectedCatalogId === item.id;
              const unaffordable = coins < item.cost;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className={`min-w-24 rounded border px-2 py-1 text-left text-xs ${
                    selected
                      ? "border-yellow-300 bg-amber-900 text-yellow-100"
                      : "border-amber-950 bg-[#2a1b10] text-amber-100"
                  } ${unaffordable ? "opacity-40" : ""}`}
                >
                  <span className="block font-medium">{item.name}</span>
                  <span className="text-yellow-200/80">{item.cost}c</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
