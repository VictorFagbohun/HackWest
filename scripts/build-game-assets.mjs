/**
 * Builds campus extras, player walk sheet, building sprites, and a Tiled map.
 * Environment tiles come from Kenney Tiny Town (CC0). Characters use Kenney
 * Tiny Dungeon (CC0) as the base, with original walk frames derived from it.
 */
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicGame = join(root, "public", "game");
const townPath = join(publicGame, "tilesets", "tiny-town.png");
const dungeonSrc = join(publicGame, "tilesets", "_tiny-dungeon-src.png");

const TILE = 16;
const TOWN_COLS = 12;

function readPng(path) {
  return PNG.sync.read(readFileSync(path));
}

function makePng(width, height) {
  return new PNG({ width, height, colorType: 6 });
}

function destIdx(png, x, y) {
  return (y * png.width + x) << 2;
}

function clear(png) {
  png.data.fill(0);
}

function put(png, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = destIdx(png, x, y);
  png.data[i] = r;
  png.data[i + 1] = g;
  png.data[i + 2] = b;
  png.data[i + 3] = a;
}

function get(png, x, y) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return [0, 0, 0, 0];
  }
  const i = destIdx(png, x, y);
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

function blit(src, sx, sy, sw, sh, dest, dx, dy, flipX = false) {
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const [r, g, b, a] = get(src, sx + x, sy + y);
      if (a === 0) continue;
      const xx = flipX ? dx + (sw - 1 - x) : dx + x;
      put(dest, xx, dy + y, r, g, b, a);
    }
  }
}

function blitTile(src, tileIndex, cols, dest, dx, dy) {
  const sx = (tileIndex % cols) * TILE;
  const sy = Math.floor(tileIndex / cols) * TILE;
  blit(src, sx, sy, TILE, TILE, dest, dx, dy);
}

function fillRect(png, x, y, w, h, r, g, b, a = 255) {
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      put(png, x + xx, y + yy, r, g, b, a);
    }
  }
}

function writePng(png, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
}

const C = {
  outline: [47, 36, 56],
  water0: [58, 134, 196],
  water1: [74, 157, 214],
  water2: [99, 176, 222],
  foam: [214, 237, 247],
  lily: [86, 176, 74],
  lily2: [232, 118, 150],
  path: [198, 186, 160],
  path2: [176, 160, 128],
  pathDark: [140, 122, 96],
  wood: [168, 106, 62],
  woodDark: [122, 72, 40],
  iron: [74, 74, 90],
  glow: [255, 214, 102],
  flowerY: [247, 214, 74],
  flowerP: [214, 108, 186],
  flowerR: [224, 82, 90],
  stone: [168, 172, 186],
  stone2: [140, 146, 164],
  fountain: [90, 168, 214],
};

function drawWater(png, ox, oy, frame, kind) {
  const wobble = frame === 0 ? 0 : frame === 1 ? 1 : -1;
  const base = frame === 2 ? C.water1 : C.water0;
  const hi = frame === 1 ? C.water2 : C.water1;

  fillRect(png, ox, oy, 16, 16, ...base);

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const wave = (x + y + wobble * 2) % 5 === 0;
      if (wave) put(png, ox + x, oy + y, ...hi);
    }
  }

  const edge = C.foam;
  if (kind.includes("n")) fillRect(png, ox, oy, 16, 2, ...edge);
  if (kind.includes("s")) fillRect(png, ox, oy + 14, 16, 2, ...edge);
  if (kind.includes("w")) fillRect(png, ox, oy, 2, 16, ...edge);
  if (kind.includes("e")) fillRect(png, ox + 14, oy, 2, 16, ...edge);

  if (kind === "lily") {
    put(png, ox + 5, oy + 7, ...C.lily);
    put(png, ox + 6, oy + 6, ...C.lily);
    put(png, ox + 7, oy + 7, ...C.lily);
    put(png, ox + 6, oy + 7, ...C.lily2);
    put(png, ox + 10, oy + 10, ...C.lily);
    put(png, ox + 11, oy + 10, ...C.lily);
  }
}

function drawPath(png, ox, oy, alt) {
  fillRect(png, ox, oy, 16, 16, ...(alt ? C.path2 : C.path));
  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 7 + (alt ? 3 : 1)) % 14) + 1;
    const y = ((i * 5 + (alt ? 2 : 4)) % 14) + 1;
    put(png, ox + x, oy + y, ...C.pathDark);
  }
}

function drawBench(png, ox, oy) {
  fillRect(png, ox + 2, oy + 9, 12, 2, ...C.wood);
  fillRect(png, ox + 2, oy + 11, 2, 4, ...C.woodDark);
  fillRect(png, ox + 12, oy + 11, 2, 4, ...C.woodDark);
  fillRect(png, ox + 2, oy + 7, 12, 2, ...C.woodDark);
  for (let x = 2; x < 14; x += 1) put(png, ox + x, oy + 9, ...C.outline);
}

function drawLamp(png, ox, oy) {
  fillRect(png, ox + 7, oy + 8, 2, 7, ...C.iron);
  fillRect(png, ox + 5, oy + 3, 6, 5, ...C.glow);
  put(png, ox + 6, oy + 4, 255, 244, 180);
  put(png, ox + 8, oy + 5, 255, 244, 180);
  fillRect(png, ox + 5, oy + 2, 6, 1, ...C.iron);
  fillRect(png, ox + 6, oy + 15, 4, 1, ...C.iron);
}

function drawFlowerBed(png, ox, oy) {
  fillRect(png, ox + 2, oy + 10, 12, 4, 86, 140, 58);
  put(png, ox + 4, oy + 8, ...C.flowerY);
  put(png, ox + 5, oy + 7, ...C.flowerY);
  put(png, ox + 8, oy + 8, ...C.flowerP);
  put(png, ox + 11, oy + 7, ...C.flowerR);
  put(png, ox + 6, oy + 11, ...C.flowerP);
}

function drawFountain(png, ox, oy, top) {
  if (top) {
    fillRect(png, ox + 6, oy + 4, 4, 8, ...C.fountain);
    fillRect(png, ox + 7, oy + 2, 2, 3, C.foam[0], C.foam[1], C.foam[2]);
    put(png, ox + 5, oy + 6, ...C.water2);
    put(png, ox + 10, oy + 7, ...C.water2);
  } else {
    fillRect(png, ox + 2, oy + 6, 12, 8, ...C.stone);
    fillRect(png, ox + 4, oy + 8, 8, 4, ...C.fountain);
    fillRect(png, ox + 3, oy + 13, 10, 2, ...C.stone2);
  }
}

function buildExtras() {
  const cols = 8;
  const rows = 4;
  const png = makePng(cols * TILE, rows * TILE);
  clear(png);

  const kinds = [
    ["c", 0],
    ["c", 1],
    ["c", 2],
    ["n", 0],
    ["e", 0],
    ["s", 0],
    ["w", 0],
    ["ne", 0],
    ["nw", 0],
    ["se", 0],
    ["sw", 0],
    ["lily", 1],
    ["path", 0],
    ["path2", 0],
    ["bench", 0],
    ["lamp", 0],
    ["flowers", 0],
    ["ftop", 0],
    ["fbase", 0],
    ["cobble", 0],
  ];

  kinds.forEach((entry, index) => {
    const [kind, frame] = entry;
    const x = (index % cols) * TILE;
    const y = Math.floor(index / cols) * TILE;
    if (kind === "path") drawPath(png, x, y, false);
    else if (kind === "path2" || kind === "cobble") drawPath(png, x, y, true);
    else if (kind === "bench") drawBench(png, x, y);
    else if (kind === "lamp") drawLamp(png, x, y);
    else if (kind === "flowers") drawFlowerBed(png, x, y);
    else if (kind === "ftop") drawFountain(png, x, y, true);
    else if (kind === "fbase") drawFountain(png, x, y, false);
    else drawWater(png, x, y, frame, kind);
  });

  writePng(png, join(publicGame, "tilesets", "campus-extras.png"));
  return { cols, rows, count: cols * rows };
}

function composeBuilding(town, tiles, cols, rows, outPath) {
  const png = makePng(cols * TILE, rows * TILE);
  clear(png);
  tiles.forEach((tileIndex, i) => {
    if (tileIndex < 0) return;
    const x = (i % cols) * TILE;
    const y = Math.floor(i / cols) * TILE;
    blitTile(town, tileIndex, TOWN_COLS, png, x, y);
  });
  writePng(png, outPath);
}

function extractDecor(town, tileIndex, name) {
  const png = makePng(TILE, TILE);
  clear(png);
  blitTile(town, tileIndex, TOWN_COLS, png, 0, 0);
  writePng(png, join(publicGame, "decorations", `${name}.png`));
}

function buildPlayer(dungeon) {
  // Casual villager from Tiny Dungeon (tile 85) — not the knight frames.
  const base = makePng(TILE, TILE);
  clear(base);
  blitTile(dungeon, 85, TOWN_COLS, base, 0, 0);

  // Approximate a rear view: same outfit, face covered by hair/hood pixels.
  const back = makePng(TILE, TILE);
  clear(back);
  blitTile(dungeon, 85, TOWN_COLS, back, 0, 0);
  for (let y = 2; y <= 6; y += 1) {
    for (let x = 4; x <= 11; x += 1) {
      const [r, g, b, a] = get(base, x, 2);
      if (a > 0) put(back, x, y, Math.max(0, r - 18), Math.max(0, g - 18), Math.max(0, b - 10), a);
    }
  }

  const sheet = makePng(TILE * 4, TILE * 4);
  clear(sheet);

  const stamp = (framePng, row, col, flipX = false) => {
    blit(framePng, 0, 0, TILE, TILE, sheet, col * TILE, row * TILE, flipX);
  };

  const bob = (src, dy) => {
    const frame = makePng(TILE, TILE);
    clear(frame);
    blit(src, 0, 0, TILE, TILE, frame, 0, dy);
    return frame;
  };

  // Down
  stamp(base, 0, 0);
  stamp(bob(base, 1), 0, 1);
  stamp(base, 0, 2);
  stamp(bob(base, 0), 0, 3);

  // Left (flipped)
  stamp(base, 1, 0, true);
  stamp(bob(base, 1), 1, 1, true);
  stamp(base, 1, 2, true);
  stamp(bob(base, 0), 1, 3, true);

  // Right
  stamp(base, 2, 0);
  stamp(bob(base, 1), 2, 1);
  stamp(base, 2, 2);
  stamp(bob(base, 0), 2, 3);

  // Up
  stamp(back, 3, 0);
  stamp(bob(back, 1), 3, 1);
  stamp(back, 3, 2);
  stamp(bob(back, 0), 3, 3);

  writePng(sheet, join(publicGame, "characters", "student.png"));
}

function emptyLayer(name, width, height, data) {
  return {
    name,
    type: "tilelayer",
    width,
    height,
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    id: Math.floor(Math.random() * 10000) + 1,
    data,
  };
}

function fill(width, height, value) {
  return Array.from({ length: width * height }, () => value);
}

function setTile(data, width, x, y, value) {
  if (x < 0 || y < 0 || x >= width) return;
  const height = data.length / width;
  if (y >= height) return;
  data[y * width + x] = value;
}

function stampRect(data, width, x, y, w, h, value) {
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      setTile(data, width, x + xx, y + yy, value);
    }
  }
}

function stampHPath(data, width, x, y, length, values) {
  for (let i = 0; i < length; i += 1) {
    setTile(data, width, x + i, y, values[i % values.length]);
    if (y + 1 < data.length / width) {
      setTile(data, width, x + i, y + 1, values[(i + 1) % values.length]);
    }
  }
}

function stampVPath(data, width, x, y, length, values) {
  for (let i = 0; i < length; i += 1) {
    setTile(data, width, x, y + i, values[i % values.length]);
    setTile(data, width, x + 1, y + i, values[(i + 1) % values.length]);
  }
}

function buildCampusMap() {
  const width = 48;
  const height = 36;
  // Tiled GIDs = tilesheet index + firstgid (1)
  const grass = 1; // tile 0
  const grassAlt = 2; // tile 1 flowers
  const grassTuft = 3; // tile 2
  const dirt = 26; // tile 25 — dirt autotile center
  const extrasFirst = 133;
  const water = extrasFirst;
  const waterLily = extrasFirst + 11;
  const path = extrasFirst + 12;
  const path2 = extrasFirst + 13;
  const flowerBed = extrasFirst + 16;
  const fountainTop = extrasFirst + 17;
  const fountainBase = extrasFirst + 18;

  const ground = fill(width, height, grass);
  const details = fill(width, height, 0);
  const scenery = fill(width, height, 0);
  const waterLayer = fill(width, height, 0);
  const collision = fill(width, height, 0);
  const pine = 5; // tile 4
  const bush = 6; // tile 5
  const autumn = 4; // tile 3
  const mushrooms = 30; // tile 29
  const sign = 84; // tile 83

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const n = (x * 13 + y * 7) % 11;
      if (n === 0) setTile(ground, width, x, y, grassAlt);
      else if (n === 5) setTile(ground, width, x, y, grassTuft);
    }
  }

  stampHPath(ground, width, 8, 17, 32, [dirt, dirt]);
  stampHPath(ground, width, 6, 26, 20, [dirt, dirt]);
  stampVPath(ground, width, 23, 8, 22, [dirt, dirt]);
  stampVPath(ground, width, 12, 12, 16, [dirt, dirt]);
  stampVPath(ground, width, 34, 10, 18, [dirt, dirt]);

  stampHPath(details, width, 8, 17, 32, [path, path2]);
  stampHPath(details, width, 6, 26, 20, [path2, path]);
  stampVPath(details, width, 23, 8, 22, [path, path2]);
  stampVPath(details, width, 12, 12, 16, [path2, path]);
  stampVPath(details, width, 34, 10, 18, [path, path2]);

  // Plaza + fountain
  stampRect(ground, width, 21, 16, 7, 6, dirt);
  stampRect(details, width, 21, 16, 7, 6, path);
  setTile(scenery, width, 24, 17, fountainTop);
  setTile(scenery, width, 24, 18, fountainBase);
  setTile(collision, width, 24, 17, fountainTop);
  setTile(collision, width, 24, 18, fountainBase);

  // Pond in the northeast
  const pond = [
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0],
  ];
  const pondX = 36;
  const pondY = 5;
  pond.forEach((row, yy) => {
    row.forEach((cell, xx) => {
      if (!cell) return;
      setTile(waterLayer, width, pondX + xx, pondY + yy, water);
      setTile(collision, width, pondX + xx, pondY + yy, water);
      setTile(ground, width, pondX + xx, pondY + yy, dirt);
    });
  });
  setTile(waterLayer, width, pondX + 2, pondY + 2, waterLily);

  // Flower beds near pond and plaza
  [
    [35, 4],
    [41, 4],
    [35, 10],
    [20, 15],
    [28, 15],
    [10, 24],
  ].forEach(([x, y]) => setTile(details, width, x, y, flowerBed));

  setTile(scenery, width, 22, 15, sign);
  setTile(scenery, width, 38, 11, mushrooms);

  for (let x = 1; x < width - 1; x += 2) {
    const tree = x % 3 === 0 ? autumn : x % 3 === 1 ? pine : bush;
    setTile(scenery, width, x, 1, tree);
    setTile(scenery, width, x, height - 2, tree);
    setTile(collision, width, x, 1, tree);
    setTile(collision, width, x, height - 2, tree);
  }
  for (let y = 2; y < height - 2; y += 2) {
    const tree = y % 3 === 0 ? bush : pine;
    setTile(scenery, width, 1, y, tree);
    setTile(scenery, width, width - 2, y, tree);
    setTile(collision, width, 1, y, tree);
    setTile(collision, width, width - 2, y, tree);
  }

  const map = {
    compressionlevel: -1,
    width,
    height,
    tilewidth: TILE,
    tileheight: TILE,
    infinite: false,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.10.2",
    type: "map",
    version: "1.10",
    nextlayerid: 10,
    nextobjectid: 1,
    layers: [
      emptyLayer("ground", width, height, ground),
      emptyLayer("water", width, height, waterLayer),
      emptyLayer("details", width, height, details),
      emptyLayer("scenery", width, height, scenery),
      { ...emptyLayer("collision", width, height, collision), visible: false },
    ],
    tilesets: [
      {
        firstgid: 1,
        columns: 12,
        image: "../tilesets/tiny-town.png",
        imagewidth: 192,
        imageheight: 176,
        margin: 0,
        spacing: 0,
        name: "tiny-town",
        tilecount: 132,
        tilewidth: TILE,
        tileheight: TILE,
      },
      {
        firstgid: extrasFirst,
        columns: 8,
        image: "../tilesets/campus-extras.png",
        imagewidth: 128,
        imageheight: 64,
        margin: 0,
        spacing: 0,
        name: "campus-extras",
        tilecount: 32,
        tilewidth: TILE,
        tileheight: TILE,
      },
    ],
  };

  writeFileSync(
    join(publicGame, "maps", "campus.json"),
    JSON.stringify(map, null, 2),
  );
}

function main() {
  const town = readPng(townPath);
  const dungeon = readPng(dungeonSrc);

  buildExtras();

  // Indices verified against Kenney Tiny Town packed sheet (12 cols).
  // Career Center — red clay roof + wood walls with door.
  composeBuilding(
    town,
    [51, 52, 53, 63, 64, 65, 84, 85, 86],
    3,
    3,
    join(publicGame, "buildings", "career.png"),
  );
  // Library — wide blue roof + stone walls with doors/windows.
  composeBuilding(
    town,
    [48, 49, 49, 50, 60, 61, 61, 62, 88, 89, 90, 91],
    4,
    3,
    join(publicGame, "buildings", "library.png"),
  );
  // Org Hall — blue slate roof + wood walls.
  composeBuilding(
    town,
    [48, 49, 50, 60, 61, 62, 72, 73, 74],
    3,
    3,
    join(publicGame, "buildings", "org-hall.png"),
  );
  // Gym — stone keep / gatehouse.
  composeBuilding(
    town,
    [99, 100, 101, 111, 112, 113, 123, 124, 125],
    3,
    3,
    join(publicGame, "buildings", "gym.png"),
  );

  // Tall trees as 1x2 sprites (canopy + trunk).
  composeBuilding(town, [4, 16], 1, 2, join(publicGame, "decorations", "tree-pine.png"));
  composeBuilding(town, [3, 15], 1, 2, join(publicGame, "decorations", "tree-autumn.png"));
  composeBuilding(town, [7, 8, 19, 20], 2, 2, join(publicGame, "decorations", "tree-round.png"));
  extractDecor(town, 5, "bush");
  extractDecor(town, 29, "mushrooms");
  extractDecor(town, 1, "grass-flower");
  extractDecor(town, 83, "sign");
  extractDecor(town, 104, "well");

  const bench = makePng(TILE, TILE);
  clear(bench);
  drawBench(bench, 0, 0);
  writePng(bench, join(publicGame, "decorations", "bench.png"));

  const lamp = makePng(TILE, TILE);
  clear(lamp);
  drawLamp(lamp, 0, 0);
  writePng(lamp, join(publicGame, "decorations", "lamp.png"));

  const flowers = makePng(TILE, TILE);
  clear(flowers);
  drawFlowerBed(flowers, 0, 0);
  writePng(flowers, join(publicGame, "decorations", "flowers.png"));

  buildPlayer(dungeon);
  buildCampusMap();

  writeFileSync(
    join(publicGame, "LICENSE.txt"),
    [
      "Game art licenses",
      "",
      "Kenney Tiny Town — CC0 1.0 Universal — https://kenney.nl/assets/tiny-town",
      "Kenney Tiny Dungeon — CC0 1.0 Universal — https://kenney.nl/assets/tiny-dungeon",
      "",
      "Campus extras (water, paths, benches, lamps, flower beds, fountain)",
      "are original 16x16 tiles created for Campus Quest.",
      "",
      "Attribution is not required for Kenney CC0 packs; we credit Kenney.nl anyway.",
      "",
    ].join("\n"),
  );

  console.log("Game assets built.");
}

main();
