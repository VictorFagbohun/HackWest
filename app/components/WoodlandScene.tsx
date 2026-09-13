const trees = [
  { x: 5, y: 2 },
  { x: 26, y: 12, dark: true },
  { x: 48, y: 3 },
  { x: 69, y: 15, dark: true },
  { x: 87, y: 5 },
  { x: 5, y: 81, dark: true },
  { x: 35, y: 77 },
  { x: 64, y: 73, dark: true },
  { x: 87, y: 69 },
];

const flowers = [[23, 38], [43, 28], [82, 30], [27, 91], [58, 92], [80, 91]];
const bushes = [
  { x: 15, y: 26, dark: true },
  { x: 37, y: 19 },
  { x: 58, y: 27, dark: true },
  { x: 78, y: 18 },
  { x: 18, y: 87 },
  { x: 51, y: 84, dark: true },
  { x: 76, y: 80 },
];
const rocks = [[4, 42], [62, 38]];

export function WoodlandScene() {
  return (
    <div
      className="woodland-scene"
      role="img"
      aria-label="A little pixel adventurer wandering along a path in the woods"
    >
      <div className="woodland-path" />
      {trees.map(({ x, y, dark }, index) => (
        <span
          key={index}
          className={`woodland-tree ${dark ? "woodland-tree-dark" : ""}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
      {flowers.map(([x, y], index) => (
        <span key={index} className="woodland-flowers" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
      {bushes.map(({ x, y, dark }, index) => (
        <span
          key={index}
          className={`woodland-bush ${dark ? "woodland-bush-dark" : ""}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
      {rocks.map(([x, y], index) => (
        <span key={index} className="woodland-rock" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
      <span className="woodland-walker"><span className="woodland-character" /></span>
    </div>
  );
}
