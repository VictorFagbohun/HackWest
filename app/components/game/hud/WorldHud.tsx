"use client";

import { CATALOG, catalogAssetPath, type CatalogItem } from "@/types/world";

interface WorldHudProps {
  worldName: string;
  playerName: string;
  coins: number;
  editable: boolean;
  buildMode: boolean;
  selectedCatalogId: string | null;
  prompt: string | null;
  onToggleBuild: () => void;
  onSelectItem: (item: CatalogItem) => void;
  onEditableChange?: (editable: boolean) => void;
}

export function WorldHud({
  worldName,
  playerName,
  coins,
  editable,
  buildMode,
  selectedCatalogId,
  prompt,
  onToggleBuild,
  onSelectItem,
  onEditableChange,
}: WorldHudProps) {
  const buildings = CATALOG.filter((item) => item.kind === "building");
  const decor = CATALOG.filter((item) => item.kind === "decor");

  return (
    <div className="hud-root">
      <header className="hud-top">
        <div className="hud-brand">
          <span className="hud-brand-mark">Campus Quest</span>
          <div>
            <p className="hud-eyebrow">Open World</p>
            <h1 className="hud-title">{worldName}</h1>
          </div>
        </div>

        <div className="hud-stats">
          <div className="hud-chip">
            <span className="hud-chip-label">Explorer</span>
            <span className="hud-chip-value">{playerName}</span>
          </div>
          <div className="hud-chip hud-chip-coins">
            <span className="hud-chip-label">Coins</span>
            <span className="hud-chip-value">{coins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="hud-middle">
        {prompt ? <div className="hud-prompt">{prompt}</div> : null}
      </div>

      <footer className="hud-bottom">
        <div className="hud-controls">
          <p className="hud-hint">
            WASD / arrows to walk
            {editable
              ? " · Build to place · E inspect · Del remove"
              : " · E inspect"}
          </p>

          <div className="hud-actions">
            {onEditableChange ? (
              <button
                type="button"
                className="hud-btn"
                onClick={() => onEditableChange(!editable)}
              >
                {editable ? "Visit mode" : "Edit world"}
              </button>
            ) : null}

            {editable ? (
              <button
                type="button"
                className={`hud-btn hud-btn-primary ${buildMode ? "is-active" : ""}`}
                onClick={onToggleBuild}
              >
                {buildMode ? "Explore" : "Build"}
              </button>
            ) : (
              <span className="hud-lock">Visit only</span>
            )}
          </div>
        </div>

        {editable && buildMode ? (
          <div className="hud-catalog">
            <CatalogRow
              label="Buildings"
              items={buildings}
              coins={coins}
              selectedCatalogId={selectedCatalogId}
              onSelectItem={onSelectItem}
            />
            <CatalogRow
              label="Decor"
              items={decor}
              coins={coins}
              selectedCatalogId={selectedCatalogId}
              onSelectItem={onSelectItem}
            />
          </div>
        ) : null}
      </footer>
    </div>
  );
}

function CatalogRow({
  label,
  items,
  coins,
  selectedCatalogId,
  onSelectItem,
}: {
  label: string;
  items: CatalogItem[];
  coins: number;
  selectedCatalogId: string | null;
  onSelectItem: (item: CatalogItem) => void;
}) {
  return (
    <div className="hud-catalog-row">
      <p className="hud-catalog-label">{label}</p>
      <div className="hud-catalog-scroller">
        {items.map((item) => {
          const selected = selectedCatalogId === item.id;
          const unaffordable = coins < item.cost;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item)}
              className={`hud-catalog-item ${selected ? "is-selected" : ""} ${
                unaffordable ? "is-locked" : ""
              }`}
              title={`${item.name} · ${item.cost}c`}
            >
              <span className="hud-catalog-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={catalogAssetPath(item)} alt="" draggable={false} />
              </span>
              <span className="hud-catalog-meta">
                <span className="hud-catalog-name">{item.name}</span>
                <span className="hud-catalog-cost">{item.cost}c</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
