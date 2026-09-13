/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

const clouds = [
  { left: "-2%", top: "8%", scale: 1.15 },
  { left: "24%", top: "17%", scale: 0.72 },
  { left: "67%", top: "9%", scale: 0.92 },
  { left: "88%", top: "19%", scale: 0.62 },
];

const trees = [
  { src: "/game/decorations/tree-round.png", left: "1%", bottom: "29%", width: "clamp(120px, 17vw, 230px)" },
  { src: "/game/decorations/tree-pine.png", left: "15%", bottom: "39%", width: "clamp(72px, 9vw, 125px)", dark: true },
  { src: "/game/decorations/tree-pine.png", left: "76%", bottom: "38%", width: "clamp(88px, 11vw, 145px)" },
  { src: "/game/decorations/tree-round.png", left: "calc(99% - clamp(125px, 18vw, 240px))", bottom: "29%", width: "clamp(125px, 18vw, 240px)", dark: true },
];

const foregroundDecor = [
  { src: "/game/decorations/bush.png", left: "7%", bottom: "23%", size: 62 },
  { src: "/game/decorations/flowers.png", left: "20%", bottom: "28%", size: 50 },
  { src: "/game/decorations/bench.png", left: "27%", bottom: "28%", size: 74 },
  { src: "/game/decorations/mushrooms.png", left: "69%", bottom: "27%", size: 44 },
  { src: "/game/decorations/well.png", left: "74%", bottom: "28%", size: 70 },
  { src: "/game/decorations/grass-flower.png", left: "86%", bottom: "24%", size: 48 },
];

export function WoodlandScene({ showLogin = false }: { showLogin?: boolean }) {
  return (
    <div
      className="woodland-scene"
      role={showLogin ? "group" : "img"}
      aria-label="A bright pixel-art campus valley with a student walking past the campus hall"
    >
      <div className="woodland-sky" aria-hidden="true">
        <span className="woodland-sun" />
        {clouds.map((cloud, index) => (
          <span
            key={index}
            className="woodland-cloud"
            style={{ left: cloud.left, top: cloud.top, transform: `scale(${cloud.scale})` }}
          />
        ))}
      </div>

      <div className="woodland-mountains woodland-mountains-far" aria-hidden="true" />
      <div className="woodland-mountains woodland-mountains-near" aria-hidden="true" />
      <div className="woodland-meadow" aria-hidden="true" />
      <div className="woodland-fence" aria-hidden="true" />
      <div className="woodland-path" aria-hidden="true" />

      {trees.map((tree, index) => (
        <img
          key={index}
          className={`woodland-tree ${tree.dark ? "woodland-tree-dark" : ""}`}
          src={tree.src}
          alt=""
          aria-hidden="true"
          style={{ left: tree.left, bottom: tree.bottom, width: tree.width }}
        />
      ))}

      <div className="woodland-campus-hall" aria-hidden={showLogin ? undefined : true}>
        <img src="/game/buildings/library.png" alt="" />
        {showLogin ? (
          <Link href="/login" aria-label="Log in" className="landing-login-link">
            <span aria-hidden="true" className="inline-flex">
              {Array.from("Log in").map((letter, index) => (
                <span
                  key={index}
                  className="login-letter"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {letter === " " ? "\u00a0" : letter}
                </span>
              ))}
            </span>
          </Link>
        ) : null}
      </div>

      {foregroundDecor.map((item, index) => (
        <img
          key={index}
          className="woodland-decoration"
          src={item.src}
          alt=""
          aria-hidden="true"
          style={{ left: item.left, bottom: item.bottom, width: `${item.size}px` }}
        />
      ))}

      <span className="woodland-walker" aria-hidden="true">
        <span className="woodland-character" />
      </span>

      <div className="woodland-foreground" aria-hidden="true" />
    </div>
  );
}
