/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";

const clouds = [
  { left: "6%", top: "14%", scale: 0.9 },
  { left: "38%", top: "9%", scale: 1.15 },
  { left: "72%", top: "18%", scale: 0.78 },
];

const trees: Array<{
  left?: string;
  right?: string;
  bottom: string;
  width: number;
  tint: string;
}> = [
  { left: "8%", bottom: "33%", width: 56, tint: "home-lobby-tree-a" },
  { left: "68%", bottom: "37%", width: 48, tint: "home-lobby-tree-b" },
  { right: "5%", bottom: "30%", width: 60, tint: "home-lobby-tree-c" },
];

const flowers = [
  { src: "/game/decorations/flowers.png", left: "22%", bottom: "24%", size: 36 },
  { src: "/game/decorations/grass-flower.png", left: "68%", bottom: "22%", size: 32 },
  { src: "/game/decorations/flowers.png", left: "82%", bottom: "20%", size: 28 },
];

const birds = [
  { top: "18%", duration: "28s", delay: "0s", scale: 1 },
  { top: "28%", duration: "36s", delay: "-12s", scale: 0.85 },
  { top: "12%", duration: "22s", delay: "-6s", scale: 0.7 },
];

export function HomeLobbyScene({ playerName }: { playerName: string }) {
  return (
    <div
      className="home-lobby-scene"
      role="img"
      aria-label={`${playerName} standing in a bright campus meadow`}
    >
      <div className="home-lobby-sky" aria-hidden="true">
        <span className="home-lobby-sun" />
        {clouds.map((cloud, index) => (
          <span
            key={index}
            className="home-lobby-cloud"
            style={{
              left: cloud.left,
              top: cloud.top,
              transform: `scale(${cloud.scale})`,
            }}
          />
        ))}
        {birds.map((bird, index) => {
          const style = {
            top: bird.top,
            animationDuration: bird.duration,
            animationDelay: bird.delay,
            "--bird-scale": bird.scale,
          } as CSSProperties;

          return (
            <span
              key={index}
              className={`home-lobby-bird home-lobby-bird-${index + 1}`}
              style={style}
            >
              <i className="home-lobby-bird-wing home-lobby-bird-wing-left" />
              <i className="home-lobby-bird-body" />
              <i className="home-lobby-bird-wing home-lobby-bird-wing-right" />
            </span>
          );
        })}
      </div>

      <div className="home-lobby-hills home-lobby-hills-far" aria-hidden="true" />
      <div className="home-lobby-hills home-lobby-hills-near" aria-hidden="true" />
      <div className="home-lobby-meadow" aria-hidden="true" />

      {trees.map((tree, index) => (
        <img
          key={index}
          className={`home-lobby-tree ${tree.tint}`}
          src="/game/decorations/tree-pine.png"
          alt=""
          aria-hidden="true"
          style={{
            left: tree.left,
            right: tree.right,
            bottom: tree.bottom,
            width: tree.width,
          }}
        />
      ))}

      {flowers.map((flower, index) => (
        <img
          key={index}
          className="home-lobby-flower"
          src={flower.src}
          alt=""
          aria-hidden="true"
          style={{
            left: flower.left,
            bottom: flower.bottom,
            width: flower.size,
          }}
        />
      ))}

      <div className="home-lobby-character-stage" aria-hidden="true">
        <span className="home-lobby-shadow" />
        <span className="home-lobby-character" />
      </div>
    </div>
  );
}
