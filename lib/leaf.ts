// A cannabis leaf drawn from geometry (no stock art, no AI image): seven
// serrated leaflets fanned from one point, plus a stem. Returns SVG path data
// in a 0..1000 box so any flyer can scale it. Pure math, so it renders on the
// server and prints sharp at any size.

type Pt = [number, number];

const LEAFLETS: { deg: number; len: number }[] = [
  { deg: 0, len: 1 },
  { deg: -27, len: 0.9 },
  { deg: 27, len: 0.9 },
  { deg: -56, len: 0.72 },
  { deg: 56, len: 0.72 },
  { deg: -94, len: 0.46 },
  { deg: 94, len: 0.46 },
];

const ORIGIN: Pt = [500, 640];
const MAX_LEN = 560;

function rot([x, y]: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
}

/** Half-width of a leaflet at t (0 = base, 1 = tip), as a share of its length. */
function halfWidth(t: number) {
  // Narrow lance: widest around 40%, long fine tip, pinched base.
  return 0.33 * Math.pow(t, 0.58) * Math.pow(1 - t, 1.2);
}

function leaflet(len: number, deg: number, teeth: number) {
  const L = len * MAX_LEN;
  const right: Pt[] = [];
  const steps = teeth;
  for (let i = 0; i < steps; i++) {
    const t0 = 0.06 + (i / steps) * 0.9;
    const t1 = 0.06 + ((i + 0.9) / steps) * 0.9;
    const w0 = halfWidth(t0) * L * 0.88;
    const w1 = halfWidth(t1) * L * 1.06 + 1.2;
    right.push([w0, -t0 * L]);
    right.push([w1, -t1 * L]);
  }
  const tip: Pt = [0, -L];
  const pts: Pt[] = [[0, 0], ...right, tip, ...right.slice().reverse().map(([x, y]) => [-x, y] as Pt), [0, 0]];
  const placed = pts.map((p) => {
    const [x, y] = rot(p, deg);
    return [ORIGIN[0] + x, ORIGIN[1] + y] as Pt;
  });
  const d = "M" + placed.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
  const [vx, vy] = rot([0, -L * 0.94], deg);
  const vein = `M${ORIGIN[0]} ${ORIGIN[1]}L${(ORIGIN[0] + vx).toFixed(1)} ${(ORIGIN[1] + vy).toFixed(1)}`;
  return { d, vein };
}

export function leafPaths() {
  const parts = LEAFLETS.map((l) => leaflet(l.len, l.deg, Math.round(16 + l.len * 14)));
  const stem = `M${ORIGIN[0]} ${ORIGIN[1]}C${ORIGIN[0] + 4} ${ORIGIN[1] + 90} ${ORIGIN[0] - 6} ${ORIGIN[1] + 190} ${ORIGIN[0] + 10} ${ORIGIN[1] + 300}`;
  return { leaflets: parts.map((p) => p.d), veins: parts.map((p) => p.vein), stem };
}

/**
 * The leaf as an SVG string.
 * mode "solid": filled silhouette (veins knocked out in `bg`).
 * mode "line": fine outline, engraved look.
 */
export function leafSvg(opts: { mode: "solid" | "line"; color: string; bg?: string; stroke?: number; title?: string; defs?: string }) {
  const { leaflets, veins, stem } = leafPaths();
  const s = opts.stroke ?? 6;
  const t = (opts.title ? `<title>${opts.title}</title>` : "") + (opts.defs ? `<defs>${opts.defs}</defs>` : "");
  if (opts.mode === "solid") {
    return `<svg viewBox="40 60 920 900" xmlns="http://www.w3.org/2000/svg" role="img">${t}<g fill="${opts.color}">${leaflets.map((d) => `<path d="${d}"/>`).join("")}</g><path d="${stem}" stroke="${opts.color}" stroke-width="${s * 1.6}" fill="none" stroke-linecap="round"/>${
      opts.bg ? `<g stroke="${opts.bg}" stroke-width="${s * 0.55}" stroke-linecap="round" fill="none">${veins.map((d) => `<path d="${d}"/>`).join("")}</g>` : ""
    }</svg>`;
  }
  // Back to front (short side pairs first, center last), each filled with the
  // background so overlapping outlines hide like a real engraving.
  const order = [5, 6, 3, 4, 1, 2, 0];
  const fill = opts.bg ?? "none";
  return `<svg viewBox="40 60 920 900" xmlns="http://www.w3.org/2000/svg" role="img">${t}<g stroke="${opts.color}" stroke-width="${s}" stroke-linejoin="round" stroke-linecap="round"><path d="${stem}" fill="none" stroke-width="${s * 1.6}"/>${order
    .map((i) => `<path d="${leaflets[i]}" fill="${fill}"/><path d="${veins[i]}" fill="none" stroke-width="${s * 0.6}"/>`)
    .join("")}</g></svg>`;
}
