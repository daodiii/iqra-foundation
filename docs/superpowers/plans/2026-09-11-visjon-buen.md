# Visjon: the arch before sunrise — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Visjon section as the mock's look G: one arch drawn across the cave ink with the tree's pen as the tree grows, the pre-dawn sky opening inside it in the pen's wake, three glass cards (Dialog, Trygghet, Inkludering) around the tree, and IQRA FOUNDATION under its roots.

**Architecture:** Three new units under `components/vision/`: `arch.ts` (pure geometry — the path, the two arch shapes, the tree's stage, the pen stroke), `dawn.ts` (the scene: a still painted once, stars and grass scattered by a pure function, a clipped repaint per frame), and a rewritten `Vision.tsx` that lets CSS place the cards and places only the measured things in JS. The tree renderer is untouched apart from two exported constants and a `refit()`.

**Tech Stack:** Next.js 16 (App Router, CSS Modules, Lightning CSS), React 19, GSAP + ScrollTrigger via `@gsap/react`, canvas 2D, vitest + jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-11-visjon-buen-design.md` — the plan argues from it; read both.

## Global constraints

- Every number is the spec's, which is the mock's (`C:\Users\daodi\code\iqra-mocks\2026-09-11-visjon-buen\`). Where the plan departs from the mock the spec says so; do not add departures.
- The tree is not redrawn. `tree.ts` changes are exactly: export `GROUND` and `TOP`, add `refit()` to the handle.
- Copy is the content file's, verbatim; no new strings in components.
- The cards are hidden in JS at mount, never in CSS.
- `contains()` is arithmetic; nothing calls `isPointInPath`.
- Write `backdrop-filter` unprefixed only (Lightning CSS adds the prefix; hand-pairing drops the unprefixed one). This plan adds no `backdrop-filter`; the cards keep `wash.card`.
- Worktree: `C:\Users\daodi\code\iqra-foundation-buen`, branch `feat/visjon-buen`. Stage explicit paths; never `git add -A`.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Run every command from the worktree: `cd /c/Users/daodi/code/iqra-foundation-buen && …` (the shell's cwd resets to the main checkout between calls).

---

### Task 1: the tree exports its ground line and can be asked to refit

**Files:**
- Modify: `components/vision/tree.ts` (the constants near the top, `fit`, `TreeHandle`, the returned handle)
- Test: `components/vision/tree.test.ts`
- Modify: `docs/superpowers/specs/2026-09-11-visjon-buen-design.md` (the "not the tree" line)

**Interfaces:**
- Produces: `export const GROUND = 0.74`, `export const TOP = 0.06` (fractions of the stage height: the ground line and the crown's top); `TreeHandle.refit(): void` — re-reads the stage's size and repaints.

- [ ] **Step 1: Write the failing test**

Append to the `describe('fit', …)` block in `components/vision/tree.test.ts`, and add `GROUND, TOP` to the import from `./tree`:

```ts
  test('the ground line and the crown top are the exported fractions', () => {
    expect(fitted.GY).toBeCloseTo(box.H * GROUND, 5);
    expect(fitted.TOPY).toBeCloseTo(box.H * TOP, 5);
  });
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision/tree.test.ts`
Expected: FAIL — `GROUND` is not exported (a TypeScript/ESM import error).

- [ ] **Step 3: Export the constants, use them in `fit`, add `refit`**

In `components/vision/tree.ts`, after `export const GROW = 3.8;`:

```ts
/**
 * Where the ground line sits in the stage and where the crown's top does, as fractions of
 * the stage's height. Exported because the section builds around them: the scene paints
 * its horizon on the first, and the stage is placed so the second lands under the top
 * card. Typed here once, so neither can drift from the figure.
 */
export const GROUND = 0.74;
export const TOP = 0.06;
```

In `fit`, replace `const GY = H * 0.74, TOPY = H * 0.06;` with `const GY = H * GROUND, TOPY = H * TOP;`.

Change the handle type:

```ts
export type TreeHandle = { setT(v: number): void; refit(): void; destroy(): void };
```

In the object returned at the end of `createVisionTree`, add `refit: size,` before `destroy()`, with the comment:

```ts
    // The section sizes the stage from where its cards landed, which the renderer cannot
    // see; this is how it says the stage changed without a synthetic resize event.
    refit: size,
```

- [ ] **Step 4: Run the tests**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision && npx tsc --noEmit`
Expected: PASS (tree.test.ts 8 tests, Vision.test.tsx still 1), tsc clean.

- [ ] **Step 5: Amend the spec's "not the tree" line**

In `docs/superpowers/specs/2026-09-11-visjon-buen-design.md`, replace
`- Not the tree. \`tree.ts\` gains two exported constants and nothing else.` with
`- Not the tree. \`tree.ts\` gains two exported constants and a \`refit()\` on its handle — the section sizes the stage and has to say so — and nothing else.`

- [ ] **Step 6: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && git add components/vision/tree.ts components/vision/tree.test.ts docs/superpowers/specs/2026-09-11-visjon-buen-design.md && git commit -q -F - <<'EOF'
tree: export the ground line and the crown top; refit on request

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 2: the arch — geometry, the stages, the pen stroke

**Files:**
- Create: `components/vision/arch.ts`
- Test: `components/vision/arch.test.ts`

**Interfaces:**
- Consumes: `TOP` from `./tree`.
- Produces:
  - `type Seg`, `type ArchPath = { length; pointAt(p): [x, y]; trace(ctx, p); region(): Path2D }`, `makePath(segs): ArchPath`
  - `type Arch = { path; cx; cy; r; apex; contains(x, y): boolean; surfaces(sideY): [number, number, number] }`
  - `desktopArch(W, H): Arch`, `phoneArch(W, H): Arch`
  - `type Rect = { left; top; width; height }`, `desktopStage(W, H, cardBottom, column): Rect`, `phoneStage(arch, W, H): Rect`
  - `CROWN = 0.85`, `drawStroke(ctx, path, p): void`

- [ ] **Step 1: Write the failing tests**

Create `components/vision/arch.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { CROWN, desktopArch, desktopStage, makePath, phoneArch, phoneStage } from './arch';
import { TOP } from './tree';

const near = (a: [number, number], b: [number, number], tol = 0.5) => {
  expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `${a} is not near ${b}`).toBeLessThan(tol);
};

describe('makePath', () => {
  // A leg, a half circle, a leg: the phone's arch in miniature.
  const path = makePath([
    { type: 'line', x0: 0, y0: 100, x1: 0, y1: 50 },
    { type: 'arc', cx: 50, cy: 50, r: 50, a0: Math.PI, a1: 2 * Math.PI },
    { type: 'line', x0: 100, y0: 50, x1: 100, y1: 100 },
  ]);

  test('its length is the segments added up', () => {
    expect(path.length).toBeCloseTo(50 + Math.PI * 50 + 50, 6);
  });

  test('walks by length from the first point to the last', () => {
    near(path.pointAt(0), [0, 100]);
    near(path.pointAt(50 / path.length), [0, 50]);
    near(path.pointAt(0.5), [50, 0]);
    near(path.pointAt(1), [100, 100]);
  });

  test('clamps outside 0..1', () => {
    near(path.pointAt(-1), [0, 100]);
    near(path.pointAt(2), [100, 100]);
  });
});

describe('desktopArch', () => {
  const W = 1272, H = 776;
  const arch = desktopArch(W, H);

  test('the circle passes through the apex and both feet', () => {
    expect(arch.apex).toBeCloseTo(H * 0.1, 6);
    expect(arch.cy - arch.r).toBeCloseTo(H * 0.1, 6);
    expect(Math.hypot(W * 0.055 - arch.cx, H - arch.cy)).toBeCloseTo(arch.r, 6);
    expect(Math.hypot(W * 0.945 - arch.cx, H - arch.cy)).toBeCloseTo(arch.r, 6);
  });

  test('the pen starts at the left foot, crosses the apex, ends at the right foot', () => {
    near(arch.path.pointAt(0), [W * 0.055, H]);
    near(arch.path.pointAt(0.5), [W / 2, H * 0.1]);
    near(arch.path.pointAt(1), [W * 0.945, H]);
  });

  test('the opening is inside the circle and above the floor', () => {
    expect(arch.contains(W / 2, H / 2)).toBe(true);
    expect(arch.contains(W * 0.055 + 30, H - 5)).toBe(true);
    expect(arch.contains(W / 2, H * 0.1 - 2)).toBe(false);
    expect(arch.contains(20, H - 2)).toBe(false);
    expect(arch.contains(W / 2, H + 2)).toBe(false);
  });

  test('the cards surface left, then top, then right, symmetrically', () => {
    const [l, t, r] = arch.surfaces(H * 0.45);
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(t);
    expect(t).toBe(0.5);
    expect(r).toBeGreaterThan(t);
    expect(r).toBeLessThan(1);
    expect(l + r).toBeCloseTo(1, 6);
  });

  test('a wide, short box still draws the arc over the top and not under the floor', () => {
    // A 1440×700 window: the feet sit above the circle's centre, and the raw angle of the
    // left foot is negative. The mock added 2π to the right foot only, and its arc went
    // the long way round — under the floor.
    const a = desktopArch(1272, 604);
    expect(a.cy).toBeGreaterThan(604);
    near(a.path.pointAt(0.5), [636, 60.4]);
    expect(a.path.length).toBeLessThan(Math.PI * a.r);
    near(a.path.pointAt(0), [1272 * 0.055, 604]);
    near(a.path.pointAt(1), [1272 * 0.945, 604]);
  });
});

describe('phoneArch', () => {
  // A Pixel 7's arch area: the box is 10px in from each side, the area 70svh tall.
  const W = 371, H = 591;
  const arch = phoneArch(W, H);

  test('a half circle on two legs, as wide as the area allows', () => {
    expect(arch.r).toBeCloseTo((W - 36) / 2, 6);
    expect(arch.apex).toBe(96);
    expect(arch.cy).toBeCloseTo(96 + arch.r, 6);
    expect(arch.path.length).toBeCloseTo(2 * (H - arch.cy) + Math.PI * arch.r, 6);
    near(arch.path.pointAt(0), [18, H]);
    near(arch.path.pointAt(0.5), [W / 2, 96]);
    near(arch.path.pointAt(1), [W - 18, H]);
  });

  test('the opening is the legs and the half circle, not the corners above it', () => {
    expect(arch.contains(W / 2, H - 10)).toBe(true);
    expect(arch.contains(30, H - 10)).toBe(true);
    expect(arch.contains(W / 2, 100)).toBe(true);
    expect(arch.contains(22, 100)).toBe(false);
    expect(arch.contains(W / 2, 90)).toBe(false);
    expect(arch.contains(W / 2, H + 1)).toBe(false);
  });

  test('the cards surface at fixed points: they stand below the arch', () => {
    expect(arch.surfaces(0)).toEqual([0.3, 0.55, 0.8]);
  });

  test('held sideways, the arc is lowered so the legs still exist', () => {
    const a = phoneArch(802, 273);
    expect(a.r).toBe(273 - 96 - 40);
    expect(a.cy).toBeLessThanOrEqual(273 - 40);
    expect(a.contains(802 / 2, 273 - 5)).toBe(true);
  });
});

describe('the stages', () => {
  test('desktop: the bottom at 0.95H, the crown starting 14px under the top card', () => {
    const s = desktopStage(1272, 776, 216, 540);
    expect(s.top + s.height).toBeCloseTo(776 * 0.95, 6);
    expect(s.top + TOP * s.height).toBeCloseTo(216 + 14, 6);
    expect(s.width).toBe(800);
    expect(s.left).toBe(236);
  });

  test('desktop: a narrow column caps the height and keeps the bottom', () => {
    const s = desktopStage(971, 776, 216, 300);
    expect(s.height).toBeCloseTo((300 - 24) / CROWN, 6);
    expect(s.top + s.height).toBeCloseTo(776 * 0.95, 6);
  });

  test('desktop: a box narrower than 800 gets a stage as wide as the box, and no negative height', () => {
    expect(desktopStage(600, 500, 200, 100).width).toBe(600);
    expect(desktopStage(0, 0, 0, 0).height).toBe(0);
  });

  test('phone: sized to the arch, centred in the room under the apex', () => {
    const arch = phoneArch(371, 591);
    const s = phoneStage(arch, 371, 591);
    const room = 591 - 36 - (96 + 26);
    expect(s.height).toBeCloseTo(Math.min((2 * arch.r - 24) / CROWN, room), 6);
    expect(s.top).toBeCloseTo(96 + 26 + (room - s.height) / 2, 6);
    expect(s.width).toBe(371);
    expect(s.left).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision/arch.test.ts`
Expected: FAIL — cannot resolve `./arch`.

- [ ] **Step 3: Write `arch.ts`**

Create `components/vision/arch.ts`:

```ts
import { TOP } from './tree';

/*
 * The arch: one stroke across the box, drawn with the tree's pen as the tree grows, and
 * the opening it makes. Geometry only. Nothing here touches a canvas except `trace`,
 * `region` and `drawStroke`, so the shapes are tested where there is no canvas at all.
 *
 * Two shapes. On a desktop it is a circle's arc through the apex and both feet, the feet on
 * the box's floor near its corners. In flow (under 1100px) it has legs — a half circle on
 * two uprights — because a circle wide enough for a phone's arch area would be taller than
 * the area. Both are a path of arcs and lines walked by length, so the pen, the stroke and
 * the scene's clip all come from one description.
 */

const TAU = Math.PI * 2;
/** The apex, as a fraction of the box's height; the feet, as a fraction of its width in from each edge. */
const APEX = 0.1;
const FOOT = 0.055;
/** In flow: the legs' distance from the area's edge and the apex's height, in px. */
const LEG_MARGIN = 18;
const PHONE_APEX = 96;
/** The widest the tree's stage gets. */
const STAGE_MAX = 800;
/**
 * How wide the renderer's crown is against its stage's height. Measured 0.814 at every
 * stage size — `fit` scales the figure uniformly — plus the blooms' halos outside the last
 * twigs. The stage is capped by this so the crown clears whatever stands beside it.
 */
export const CROWN = 0.85;

export type Seg =
  | { type: 'arc'; cx: number; cy: number; r: number; a0: number; a1: number }
  | { type: 'line'; x0: number; y0: number; x1: number; y1: number };

export type ArchPath = {
  length: number;
  /** Where the pen is, `p` of the way along: 0 is the left foot, 1 the right. */
  pointAt(p: number): [number, number];
  /** Stroke the path up to `p` in the context's current style. */
  trace(ctx: CanvasRenderingContext2D, p: number): void;
  /** The opening: the path closed along the box's floor. Browser only — jsdom has no Path2D. */
  region(): Path2D;
};

export type Arch = {
  path: ArchPath;
  /** The circle the arc lies on. */
  cx: number;
  cy: number;
  r: number;
  /** The top of the opening. */
  apex: number;
  /**
   * Whether a point is inside the opening. Arithmetic rather than `isPointInPath`, which
   * takes its point in device pixels and cost the mock the left half of its sky on every
   * 2× screen — and arithmetic runs in jsdom.
   */
  contains(x: number, y: number): boolean;
  /** How far along the path the pen is when each card surfaces: left, top, right. `sideY` is the side cards' centre. */
  surfaces(sideY: number): [number, number, number];
};

export type Rect = { left: number; top: number; width: number; height: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const segLength = (s: Seg) =>
  s.type === 'arc' ? Math.abs(s.a1 - s.a0) * s.r : Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
const segPoint = (s: Seg, f: number): [number, number] => {
  if (s.type === 'arc') {
    const a = s.a0 + (s.a1 - s.a0) * f;
    return [s.cx + Math.cos(a) * s.r, s.cy + Math.sin(a) * s.r];
  }
  return [s.x0 + (s.x1 - s.x0) * f, s.y0 + (s.y1 - s.y0) * f];
};

/** A path of arcs and straight lines, walked by length. */
export function makePath(segs: Seg[]): ArchPath {
  const len = segs.map(segLength);
  const total = len.reduce((a, b) => a + b, 0);
  return {
    length: total,
    pointAt(p) {
      let d = clamp(p, 0, 1) * total;
      for (let i = 0; i < segs.length; i++) {
        if (d <= len[i] || i === segs.length - 1) return segPoint(segs[i], len[i] ? Math.min(1, d / len[i]) : 1);
        d -= len[i];
      }
      return segPoint(segs[0], 0);
    },
    trace(ctx, p) {
      let d = clamp(p, 0, 1) * total;
      for (let i = 0; i < segs.length && d > 0; i++) {
        const s = segs[i];
        const f = Math.min(1, d / len[i]);
        ctx.beginPath();
        if (s.type === 'arc') ctx.arc(s.cx, s.cy, s.r, s.a0, s.a0 + (s.a1 - s.a0) * f);
        else {
          const [x, y] = segPoint(s, f);
          ctx.moveTo(s.x0, s.y0);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        d -= len[i];
      }
    },
    region() {
      const P = new Path2D();
      const [x0, y0] = segPoint(segs[0], 0);
      P.moveTo(x0, y0);
      for (const s of segs) {
        if (s.type === 'arc') P.arc(s.cx, s.cy, s.r, s.a0, s.a1);
        else P.lineTo(s.x1, s.y1);
      }
      P.closePath();
      return P;
    },
  };
}

/** One arch across the whole box: the circle through the apex and both feet. */
export function desktopArch(W: number, H: number): Arch {
  const cx = W / 2;
  const apex = H * APEX;
  const half = cx - W * FOOT;
  const s = H - apex;
  const r = (half * half + s * s) / (2 * s);
  const cy = apex + r;
  /*
   * The feet's angles, on one turn: the left in (π/2, 3π/2) and the right a turn on, so the
   * arc from one to the other always goes over the top. On a wide, short box the feet sit
   * above the circle's centre and the left foot's raw angle is negative; adding 2π only to
   * the right foot, as the mock did, then sent the arc the long way round, under the floor.
   */
  let aL = Math.atan2(H - cy, -half);
  if (aL < 0) aL += TAU;
  const aR = Math.atan2(H - cy, half) + TAU;
  const angleOf = (x: number, y: number) => {
    let a = Math.atan2(y - cy, x - cx);
    while (a < aL) a += TAU;
    return a;
  };
  const progressOf = (a: number) => (a - aL) / (aR - aL);
  return {
    path: makePath([{ type: 'arc', cx, cy, r, a0: aL, a1: aR }]),
    cx, cy, r, apex,
    contains: (x, y) => y <= H && Math.hypot(x - cx, y - cy) <= r,
    // Each side card surfaces as the pen passes its flank at the card's own height; the top one at the apex.
    surfaces(sideY) {
      const dx = Math.sqrt(Math.max(0, r * r - (sideY - cy) * (sideY - cy)));
      return [progressOf(angleOf(cx - dx, sideY)), 0.5, progressOf(angleOf(cx + dx, sideY))];
    },
  };
}

/** In flow: a half circle on two legs, as wide as the arch area allows. */
export function phoneArch(W: number, H: number): Arch {
  const cx = W / 2;
  const apex = PHONE_APEX;
  // As wide as the area, unless the area is too short for that — a phone held sideways —
  // in which case the arc's centre stays 40px above the floor so the legs still exist.
  const r = Math.max(1, Math.min((W - 2 * LEG_MARGIN) / 2, H - apex - 40));
  const cy = apex + r;
  const xl = cx - r;
  const xr = cx + r;
  const path = makePath([
    { type: 'line', x0: xl, y0: H, x1: xl, y1: cy },
    { type: 'arc', cx, cy, r, a0: Math.PI, a1: TAU },
    { type: 'line', x0: xr, y0: cy, x1: xr, y1: H },
  ]);
  return {
    path, cx, cy, r, apex,
    contains: (x, y) => y <= H && (Math.hypot(x - cx, y - cy) <= r || (Math.abs(x - cx) <= r && y >= cy)),
    // The cards stand below the arch here; these only pace their arrival.
    surfaces: () => [0.3, 0.55, 0.8],
  };
}

/**
 * The tree's stage on a desktop: centred, its bottom at 0.95H, its crown — the renderer's
 * top margin — starting 14px under the top card, and no wider than the column between the
 * side cards. On a laptop the column is what bites, and the tree gets smaller in the same
 * place rather than putting its crown under the glass.
 */
export function desktopStage(W: number, H: number, cardBottom: number, column: number): Rect {
  const bottom = H * 0.95;
  const top = (cardBottom + 14 - TOP * bottom) / (1 - TOP);
  const height = Math.max(0, Math.min(bottom - top, (column - 24) / CROWN));
  const width = Math.min(STAGE_MAX, W);
  return { left: W / 2 - width / 2, top: bottom - height, width, height };
}

/**
 * The tree's stage in flow: sized to the arch's width so the crown clears the legs, and
 * standing in the middle of the room under the apex.
 */
export function phoneStage(arch: Arch, W: number, H: number): Rect {
  const room = Math.max(0, H - 36 - (arch.apex + 26));
  const height = Math.min((2 * arch.r - 24) / CROWN, room);
  const width = Math.min(STAGE_MAX, W);
  return { left: W / 2 - width / 2, top: arch.apex + 26 + (room - height) / 2, width, height };
}

/**
 * The stroke, in the tree's pen: a rose glow under a navy line, and while it is still being
 * drawn, the pen itself — the seed's crimson. The caller clears the canvas.
 */
export function drawStroke(ctx: CanvasRenderingContext2D, path: ArchPath, p: number): void {
  if (p <= 0) return;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(196,122,156,0.5)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = 'rgba(196,122,156,0.55)';
  ctx.lineWidth = 1.6;
  path.trace(ctx, p);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(42,57,75,0.62)';
  ctx.lineWidth = 1.3;
  path.trace(ctx, p);
  if (p >= 1) return;
  const [x, y] = path.pointAt(p);
  const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
  g.addColorStop(0, 'rgba(171,82,99,0.55)');
  g.addColorStop(1, 'rgba(171,82,99,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(171,82,99,0.95)';
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, TAU);
  ctx.fill();
}
```

- [ ] **Step 4: Run the tests**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision/arch.test.ts && npx tsc --noEmit && npm run lint`
Expected: PASS, 15 tests; tsc and eslint clean.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && git add components/vision/arch.ts components/vision/arch.test.ts && git commit -q -F - <<'EOF'
vision: the arch — its geometry, the tree's stage, the pen stroke

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 3: the scene — scatter, the still, the clipped frame

**Files:**
- Create: `components/vision/dawn.ts`
- Test: `components/vision/dawn.test.ts`
- Modify: `vitest.setup.ts` (the `Path2D` stub)

**Interfaces:**
- Consumes: `Arch`, `Rect` from `./arch`; `GROUND` from `./tree`.
- Produces: `type DawnGeometry = { W; H; arch: Arch; stage: Rect }`; `scatter(geo): { stars, blades, GY, top, k }`; `createDawnScene(canvas, { reduced }): DawnScene | null` with `layout(geo)`, `frame(p, pen, t)`, `settle()`, `destroy()`.

- [ ] **Step 1: Write the failing tests**

Create `components/vision/dawn.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { desktopArch, desktopStage, phoneArch, phoneStage } from './arch';
import { scatter } from './dawn';
import { GROUND } from './tree';

describe('scatter', () => {
  const W = 1272, H = 776;
  const arch = desktopArch(W, H);
  const stage = desktopStage(W, H, 216, 540);
  const geo = { W, H, arch, stage };
  const field = scatter(geo);

  test('the horizon is the tree’s own ground line, the sky starts at the apex', () => {
    expect(field.GY).toBeCloseTo(stage.top + GROUND * stage.height, 6);
    expect(field.top).toBe(arch.apex);
  });

  test('every star is in the sky, inside the opening', () => {
    expect(field.stars.length).toBeGreaterThan(200);
    for (const s of field.stars) {
      expect(arch.contains(s.x, s.y)).toBe(true);
      expect(s.y).toBeGreaterThanOrEqual(field.top);
      expect(s.y).toBeLessThan(field.GY);
      expect(s.a).toBeGreaterThan(0);
      expect(s.a).toBeLessThanOrEqual(1);
    }
  });

  test('the stars thin out toward the horizon', () => {
    const band = (field.GY - field.top) * 0.68;
    const high = field.stars.filter((s) => s.y < field.top + band * 0.25).length;
    const low = field.stars.filter((s) => s.y > field.top + band * 0.75).length;
    expect(high).toBeGreaterThan(low);
  });

  test('every blade is rooted on the surface and inside the opening, none below the line', () => {
    expect(field.blades.length).toBeGreaterThan(1000);
    for (const b of field.blades) {
      expect(b.y).toBeGreaterThanOrEqual(field.GY + 3);
      expect(b.y).toBeLessThanOrEqual(field.GY + 19);
      expect(arch.contains(b.x, b.y - 6)).toBe(true);
      expect(b.h).toBeGreaterThan(0);
    }
  });

  test('the same geometry gives the same field', () => {
    const again = scatter(geo);
    expect(again.stars).toEqual(field.stars);
    expect(again.blades).toEqual(field.blades);
  });

  test('the grass is sized with the tree, and never below 0.55 of itself', () => {
    expect(field.k).toBe(1);
    const small = phoneArch(371, 420);
    const short = scatter({ W: 371, H: 420, arch: small, stage: phoneStage(small, 371, 420) });
    expect(short.k).toBeGreaterThanOrEqual(0.55);
    expect(short.k).toBeLessThan(1);
    const tall = field.blades.reduce((m, b) => Math.max(m, b.h), 0);
    const tallShort = short.blades.reduce((m, b) => Math.max(m, b.h), 0);
    expect(tallShort).toBeLessThan(tall);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision/dawn.test.ts`
Expected: FAIL — cannot resolve `./dawn`.

- [ ] **Step 3: Write `dawn.ts`**

Create `components/vision/dawn.ts`:

```ts
import type { Arch, Rect } from './arch';
import { GROUND } from './tree';

/*
 * Before sunrise: what the arch opens onto.
 *
 * Outside the stroke the ink goes on as before. Inside it, where the pen has passed, the
 * ink is sky — the cave film's own pre-dawn, deep and starred at the very top, mist by the
 * crown, the first light along the horizon — and under the tree the ground, with grass in
 * the tree's own pen and the earth the roots are in. Everything here is lines, points and
 * gradients; nothing is a texture.
 *
 * The still — sky, earth, strata, the glow — is painted once per layout into an offscreen
 * canvas. Each frame clips to the opening (and, while the stroke is still being drawn, to
 * a wiper that follows the pen), draws the still, then the stars twinkling and the grass
 * bending. Stars and blades are scattered by a pure function, tested without a canvas.
 */

export type DawnGeometry = { W: number; H: number; arch: Arch; stage: Rect };
export type Star = { x: number; y: number; s: number; a: number; ph: number; k: number; big: boolean };
export type Blade = { x: number; y: number; h: number; lean: number; ph: number; w: number; a: number; deep: boolean };
export type Field = { stars: Star[]; blades: Blade[]; GY: number; top: number; k: number };
export type DawnScene = {
  layout(geo: DawnGeometry): void;
  /** Paint at progress `p` with the pen at `pen`, at time `t` in seconds. */
  frame(p: number, pen: [number, number], t: number): void;
  /** The stroke has closed: keep the stars and the grass moving on the scene's own clock. */
  settle(): void;
  destroy(): void;
};

const TAU = Math.PI * 2;
/** The cave's colours, as lib/film.ts has them: slate to mist to the cream thread of light. */
const SKY: [number, string][] = [[0, '#1b2635'], [0.2, '#2f4258'], [0.46, '#6f8598'], [0.76, '#b3bfc2'], [1, '#e6dccb']];
/** The earth, down to the film's Quran bronze. */
const EARTH: [number, string][] = [[0, '#cfb48e'], [0.55, '#bf9d72'], [1, '#8a6234']];
const STRATA = '58,40,20';
const LIGHT = '236,214,170';
const STAR = '255,244,225';
const HALO = '255,236,196';
/** The ramp's teal, which is what the trunk starts in, and a deeper one behind it. */
const GRASS = '98,191,189';
const GRASS_DEEP = '52,150,148';
const STARS = 620;
const BLADES = 1600;
/** The stage height the grass was drawn for; a smaller tree stands in shorter grass. */
const GRASS_STAGE = 517;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seeded = (seed: number) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
};

/**
 * Where the stars and the blades are. Seeded, so the same box gives the same sky, and the
 * draws are made in a fixed order — the mock's — so the picture is the mock's.
 */
export function scatter(geo: DawnGeometry): Field {
  const { arch, stage } = geo;
  const { cx, r: R, contains } = arch;
  const top = arch.apex;
  // The horizon is the tree's own ground line.
  const GY = stage.top + GROUND * stage.height;

  // Stars live in the deep band and thin out into the mist; a few carry a halo like the blooms.
  const rs = seeded(11);
  const band = (GY - top) * 0.68;
  const stars: Star[] = [];
  for (let i = 0; i < STARS; i++) {
    const x = cx + (rs() - 0.5) * 2 * R;
    const y = top + rs() * rs() * band;
    if (!contains(x, y)) continue;
    // brightest at the top of the sky, still there by the crown, gone at the horizon
    const depth = 1 - 0.7 * ((y - top) / band);
    stars.push({ x, y, s: 0.7 + rs() * 1.9, a: (0.5 + 0.5 * rs()) * depth, ph: rs() * TAU, k: 0.5 + rs() * 1.3, big: rs() < 0.12 });
  }

  // Grass on the surface, the whole width of it: a dense fringe rooted on the line and a
  // sparser row just in front of it for depth. The roots are underground, so nothing grows
  // below the line.
  const k = clamp(stage.height / GRASS_STAGE, 0.55, 1);
  const rb = seeded(23);
  const blades: Blade[] = [];
  for (let i = 0; i < BLADES; i++) {
    const x = cx + (rb() - 0.5) * 2 * (R + 20);
    const front = rb() < 0.3;
    // rooted a little into the earth, where the roots begin, so the fringe sits on the ground rather than above it
    const y = GY + (front ? 9 + rb() * 10 : 3 + rb() * 8);
    if (!contains(x, y - 6)) continue;
    const t = rb();
    const h = (7 + 24 * Math.pow(t, 1.2) + (front ? 6 : 0)) * k;
    blades.push({
      x, y, h,
      lean: (rb() - 0.5) * 0.7,
      ph: rb() * TAU,
      w: (front ? 1.5 : 1.1) + t * 0.9,
      a: (front ? 0.7 : 0.55) + rb() * 0.35,
      deep: rb() < 0.4,
    });
  }
  return { stars, blades, GY, top, k };
}

/** The still: sky above the horizon, earth below it, the first light where they meet. */
function paintStill(sc: CanvasRenderingContext2D, W: number, H: number, cx: number, GY: number, top: number) {
  const sky = sc.createLinearGradient(0, top, 0, GY);
  for (const [at, c] of SKY) sky.addColorStop(at, c);
  sc.fillStyle = sky;
  sc.fillRect(0, 0, W, GY);
  // below the surface it is earth: the roots are underground, and the name with them
  const earth = sc.createLinearGradient(0, GY, 0, H);
  for (const [at, c] of EARTH) earth.addColorStop(at, c);
  sc.fillStyle = earth;
  sc.fillRect(0, GY, W, H - GY);
  // strata, faint and a little wavy, drawn with the pen
  const st = seeded(5);
  sc.lineWidth = 1;
  sc.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const y0 = GY + 34 + i * ((H - GY - 30) / 4) + st() * 12;
    sc.strokeStyle = `rgba(${STRATA},${0.12 + st() * 0.08})`;
    sc.beginPath();
    sc.moveTo(0, y0);
    for (let x = 0; x <= W; x += 90) sc.quadraticCurveTo(x + 45, y0 + (st() - 0.5) * 9, x + 90, y0 + (st() - 0.5) * 5);
    sc.stroke();
  }
  // a low, wide glow behind the trunk: the one thread of sunrise the cave palette carries
  const gw = Math.min(440, W * 0.36);
  sc.save();
  sc.translate(cx, GY);
  sc.scale(gw, gw * 0.3);
  const gl = sc.createRadialGradient(0, 0, 0, 0, 0, 1);
  gl.addColorStop(0, `rgba(${LIGHT},0.72)`);
  gl.addColorStop(0.45, `rgba(${LIGHT},0.28)`);
  gl.addColorStop(1, `rgba(${LIGHT},0)`);
  sc.fillStyle = gl;
  sc.beginPath();
  sc.arc(0, 0, 1, 0, TAU);
  sc.fill();
  sc.restore();
}

/** Mount the scene on a canvas; returns null where there is no 2D context. */
export function createDawnScene(canvas: HTMLCanvasElement, opts: { reduced: boolean }): DawnScene | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let geo: DawnGeometry | null = null;
  let still: HTMLCanvasElement | null = null;
  let region: Path2D | null = null;
  let stars: Star[] = [];
  let blades: Blade[] = [];
  let pivot: [number, number] = [0, 0];
  let foot: [number, number] = [0, 0];
  let last: { p: number; pen: [number, number] } = { p: 0, pen: [0, 0] };
  let raf = 0;
  let visible = true;

  function layout(g: DawnGeometry) {
    geo = g;
    const { W, H, arch } = g;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    // the opening: whatever the stroke encloses with the floor of the box
    region = arch.path.region();
    const field = scatter(g);
    stars = field.stars;
    blades = field.blades;
    still = document.createElement('canvas');
    still.width = W * DPR;
    still.height = H * DPR;
    const sc = still.getContext('2d');
    if (sc) {
      sc.setTransform(DPR, 0, 0, DPR, 0, 0);
      paintStill(sc, W, H, arch.cx, field.GY, field.top);
    }
    // the wipe pivots from well below the box, so its edge stands nearly upright and passes through the pen
    pivot = [arch.cx, H + arch.r * 0.6];
    foot = arch.path.pointAt(0);
  }

  function paint(p: number, pen: [number, number], t: number) {
    if (!geo || !still || !region) return;
    const { W, H, arch } = geo;
    ctx!.clearRect(0, 0, W, H);
    if (p <= 0) return;
    ctx!.save();
    // the opening is what the stroke encloses, and inside it only what the pen has passed
    ctx!.clip(region);
    if (p < 1) {
      const aF = Math.atan2(foot[1] - pivot[1], foot[0] - pivot[0]);
      const aP = Math.atan2(pen[1] - pivot[1], pen[0] - pivot[0]);
      ctx!.beginPath();
      ctx!.moveTo(pivot[0], pivot[1]);
      ctx!.arc(pivot[0], pivot[1], arch.r * 6, aF, aP, false);
      ctx!.closePath();
      ctx!.clip();
    }
    ctx!.drawImage(still, 0, 0, W, H);
    for (const s of stars) {
      const tw = opts.reduced ? 0.85 : 0.72 + 0.28 * Math.sin(t * s.k + s.ph);
      const al = s.a * tw;
      if (s.big) {
        const gr = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s * 8);
        gr.addColorStop(0, `rgba(${HALO},${0.55 * al})`);
        gr.addColorStop(1, `rgba(${HALO},0)`);
        ctx!.fillStyle = gr;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.s * 8, 0, TAU);
        ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${STAR},${al})`;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.s, 0, TAU);
      ctx!.fill();
    }
    // the blades bend to the same wind the tree's twigs do
    ctx!.lineCap = 'round';
    for (const b of blades) {
      const wind = opts.reduced ? 0 : Math.sin(t * 0.75 + b.x * 0.004 + b.ph) * 0.35;
      const lean = b.lean + wind;
      ctx!.strokeStyle = `rgba(${b.deep ? GRASS_DEEP : GRASS},${b.a})`;
      ctx!.lineWidth = b.w;
      ctx!.beginPath();
      ctx!.moveTo(b.x, b.y);
      ctx!.quadraticCurveTo(b.x + lean * b.h * 0.25, b.y - b.h * 0.55, b.x + lean * b.h, b.y - b.h);
      ctx!.stroke();
    }
    ctx!.restore();
  }

  // Once the stroke has closed nothing drives the frame any more, so the scene keeps its own
  // clock — and stops painting while the arch is off screen, as the tree does. Two thousand
  // strokes a frame for a reader down at Støtt oss is the one thing the mock got wrong.
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (visible && !document.hidden) paint(last.p, last.pen, now / 1000);
  };
  // The last entry, not the first: several arrive together after a busy main thread.
  const io = new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { threshold: 0.02 });
  io.observe(canvas);

  return {
    layout,
    frame(p, pen, t) {
      last = { p, pen };
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      paint(p, pen, t);
    },
    settle() {
      if (opts.reduced || raf) return;
      raf = requestAnimationFrame(tick);
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
    },
  };
}
```

- [ ] **Step 4: Extend the `Path2D` stub in `vitest.setup.ts`**

Replace the stub and its comment:

```ts
// Goes with the context stub above: jsdom has no Path2D either. The tree collects each
// depth of branches into one so the whole depth casts a single blurred stroke, and the
// scene closes the arch into one to clip the sky to it.
class Path2DStub { moveTo() {} lineTo() {} arc() {} closePath() {} }
Object.defineProperty(window, 'Path2D', { writable: true, value: Path2DStub });
```

- [ ] **Step 5: Run the tests**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision && npx tsc --noEmit && npm run lint`
Expected: PASS — dawn.test.ts 6 tests; everything else still green; tsc and eslint clean.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && git add components/vision/dawn.ts components/vision/dawn.test.ts vitest.setup.ts && git commit -q -F - <<'EOF'
vision: the scene inside the arch — sky, stars, grass, earth

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 4: the section — content, markup, CSS, motion

**Files:**
- Modify: `content/site.no.ts` (the `vision` block, lines 123–132)
- Modify: `components/vision/TreeFigure.tsx` (rewrite)
- Modify: `components/vision/Vision.tsx` (rewrite)
- Modify: `components/vision/vision.module.css` (rewrite)
- Test: `components/vision/Vision.test.tsx` (rewrite)

**Interfaces:**
- Consumes: everything Tasks 1–3 produce; `site.hero.wordLines` (`['IQRA', 'FOUNDATION']`); `wash.box`, `wash.cave`, `wash.paint`, `wash.card`; `film.vision`; `createInkWhenNear`; `EASE`, `gsap`, `reducedMotion`, `ScrollTrigger`, `useGSAP`; `setWordmarkOnDark`.
- Produces: `site.vision.values: { key, name, text }[]`, `site.vision.tree.label`; the DOM contract the e2e reads — `#visjon [data-figure]`, `[data-arch]`, `[data-scene]`, `[data-stroke]`, `[data-tree] canvas`, `[data-root]`, `[data-value=…]`.

- [ ] **Step 1: Write the failing test**

Replace `components/vision/Vision.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Vision } from './Vision';

test('three cards carry the values, the name stands under the roots, the headline is gone', () => {
  render(<Vision />);
  const cards = [...document.querySelectorAll('[data-value]')];
  expect(cards.map((c) => c.getAttribute('data-value'))).toEqual(['dialog', 'trygghet', 'inkludering']);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dialog', 'Trygghet', 'Inkludering']);
  for (const v of site.vision.values) expect(screen.getByText(v.text)).toBeInTheDocument();
  expect(document.querySelector('[data-root]')?.textContent).toBe('IQRAFOUNDATION');
  expect(screen.getByRole('figure', { name: /Dialog, Trygghet og Inkludering/ })).toBeInTheDocument();
  expect(document.getElementById('visjon')).toHaveAttribute('aria-labelledby', 'visjon-label');
  expect(document.getElementById('visjon-label')).toHaveTextContent('Visjon');
  expect(document.querySelector('[data-line]')).toBeNull();
  expect(screen.queryByText('Vi vil ha et Norge')).not.toBeInTheDocument();
});

test('the arch area holds the scene, the stroke and the tree, under the cards', () => {
  render(<Vision />);
  const arch = document.querySelector('#visjon [data-arch]')!;
  expect(arch.querySelector('[data-scene]')).not.toBeNull();
  expect(arch.querySelector('[data-stroke]')).not.toBeNull();
  expect(arch.querySelector('[data-tree] canvas')).not.toBeNull();
  const order = [...document.querySelectorAll('#visjon [data-arch], #visjon [data-value]')];
  expect(order[0]).toBe(arch);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run components/vision/Vision.test.tsx`
Expected: FAIL — `site.vision.values` is undefined.

- [ ] **Step 3: The content**

In `content/site.no.ts`, replace the `vision` block (currently `vision: { label: 'Visjon', lines: […], sub: '…', tree: { root: 'Iqra', limbs: […], label: '…' } }`) with:

```ts
  vision: {
    label: 'Visjon',
    /*
     * The hand-set headline. Off the section since the arch (2026-09-11) and used by
     * nothing; kept because whether it moves to Misjon is not decided, and deleting it
     * would hide that there is a decision to make.
     */
    lines: ['Vi vil ha et Norge', 'der folk kjenner islam', 'fra ekte møter,', 'ikke fra overskrifter.'],
    sub: 'Der det er lett å spørre, og lett å få et ærlig svar.',
    /** The three values, in the order they stand around the tree: left, top, right. */
    values: [
      {
        key: 'dialog',
        name: 'Dialog',
        text: 'Vi liker å snakke med folk. Om islam, om tro, og om det som er vanskelig å spørre om. Du kan komme med det du lurer på, og vi svarer så ærlig vi kan. Vi lærer like mye av samtalen som du gjør.',
      },
      {
        key: 'trygghet',
        name: 'Trygghet',
        text: 'Det skal være trygt å lure på ting. Ingen spørsmål er dumme, og ingen blir dømt for å stille dem. Det du sier holder vi for oss selv, og du bestemmer selv hvor langt samtalen skal gå.',
      },
      {
        key: 'inkludering',
        name: 'Inkludering',
        text: 'Alle er velkomne hos oss. Du trenger ikke være muslim, og du trenger ikke kunne noe fra før. Vi møter folk der de er, med den bakgrunnen de har. Det er sånn vi selv vil bli møtt.',
      },
    ],
    tree: {
      label: 'Et tre under en bue. Greinene er Dialog, Trygghet og Inkludering, og under røttene står Iqra Foundation.',
    },
  },
```

- [ ] **Step 4: The stage**

Replace `components/vision/TreeFigure.tsx`:

```tsx
import { site } from '@/content/site.no';
import styles from './vision.module.css';

/**
 * The stage: the tree's canvas and the name under its roots. Vision mounts the renderer on
 * it and places it; the renderer sets where the name sits and fades it in with the roots.
 * The name is the hero's lockup — the same two lines from the content file, so the two
 * cannot drift apart — and Vision tracks the second out to the first's width.
 */
export function Tree() {
  const [first, second] = site.hero.wordLines;
  return (
    <div className={styles.stage} data-tree role="figure" aria-label={site.vision.tree.label}>
      <canvas className={styles.canvas} aria-hidden="true" />
      <p className={styles.mark} data-root>
        <span className={styles.markFirst} data-mark-first>{first}</span>
        <span className={styles.markSecond} data-mark-second>{second}</span>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: The section**

Replace `components/vision/Vision.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { createInkWhenNear, type InkHandle } from '@/lib/ink';
import { setWordmarkOnDark } from '@/lib/wordmark';
import { desktopArch, desktopStage, drawStroke, phoneArch, phoneStage, type Arch, type Rect } from './arch';
import { createDawnScene } from './dawn';
import { createVisionTree, GROW } from './tree';
// TreeFigure, not Tree: on a case-insensitive filesystem './Tree' resolves to tree.ts.
import { Tree } from './TreeFigure';
import styles from './vision.module.css';

/**
 * How long the tree takes to open, in seconds. Nothing holds the reader here now that the
 * pin is gone, so it has to be shorter than a pass down the section rather than longer: at
 * five — the figure the phone branch used to run — a normal scroll left a half-grown tree
 * behind it. The arch is drawn on the same clock, and the sky opens in its wake.
 */
const OPEN = 3;

/**
 * Below this the section flows — the arch keeps the top of it with the tree inside, and
 * the cards stack under it. The same line vision.module.css draws: the CSS decides the
 * layout, and this only asks which one it chose.
 */
const FLOW = '(max-width: 1099px)';

/** The slots the three cards stand in: left, top, right. */
const SLOTS = [styles.slotLeft, styles.slotTop, styles.slotRight];

/**
 * FOUNDATION tracked out to IQRA's width, as the hero's lockup is: the tracking is what
 * makes the two lines one mark. Measured rather than set, because it depends on which font
 * has landed.
 */
function fitMark(mark: HTMLElement | null) {
  const first = mark?.querySelector<HTMLElement>('[data-mark-first]');
  const second = mark?.querySelector<HTMLElement>('[data-mark-second]');
  if (!first || !second) return;
  second.style.letterSpacing = '0';
  second.style.marginRight = '0';
  const target = first.getBoundingClientRect().width;
  const natural = second.getBoundingClientRect().width;
  const letters = (second.textContent ?? '').length || 1;
  const spacing = Math.max(0, (target - natural) / letters);
  second.style.letterSpacing = `${spacing}px`;
  // Letter-spacing lands after the last letter too; take that back so the line centres.
  second.style.marginRight = `${-spacing}px`;
}

export function Vision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const figure = section.querySelector<HTMLElement>('[data-figure]');
      const area = section.querySelector<HTMLElement>('[data-arch]');
      const stage = section.querySelector<HTMLElement>('[data-tree]');
      const sceneCanvas = section.querySelector<HTMLCanvasElement>('[data-scene]');
      const strokeCanvas = section.querySelector<HTMLCanvasElement>('[data-stroke]');
      const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-value]'));
      if (!figure || !area || !stage || !sceneCanvas || !strokeCanvas || cards.length !== 3) return;
      const treeCanvas = stage.querySelector('canvas');
      const mark = stage.querySelector<HTMLElement>('[data-root]');
      const reduced = reducedMotion();
      const DPR = Math.min(window.devicePixelRatio || 1, 2);

      const tree = treeCanvas ? createVisionTree(stage, treeCanvas, { reduced, limbLabels: [], rootLabel: mark }) : null;

      /*
       * The cave before sunrise, in ink. The host is the section rather than the canvas, so
       * a hand moving across the copy stirs the colour behind it too — the cards are glass
       * lying on the water, not a lid on it. `createInk` returns null wherever WebGL2 or a
       * float colour buffer is missing, and the box keeps the still gradient underneath;
       * the scene inside the arch is 2D and draws either way.
       */
      const inkCanvas = section.querySelector<HTMLCanvasElement>('[data-ink]');
      const ink: InkHandle | null = inkCanvas
        ? createInkWhenNear(inkCanvas, { reduced, palette: film.vision, host: section })
        : null;
      const scene = createDawnScene(sceneCanvas, { reduced });
      const strokeCtx = strokeCanvas.getContext('2d');

      /* The geometry, remade on every layout. */
      let arch: Arch | null = null;
      let surfaces: [number, number, number] = [0.3, 0.55, 0.8];
      let W = 0;
      let H = 0;
      /** The tree's growth time; the stroke and the scene are drawn from it. */
      let T = reduced ? 99 : 0;
      let settled = reduced;
      let dead = false;
      const shown = [false, false, false];

      const draw = () => {
        if (!arch) return;
        const p = Math.min(1, T / GROW);
        if (strokeCtx) {
          strokeCtx.clearRect(0, 0, W, H);
          drawStroke(strokeCtx, arch.path, p);
        }
        scene?.frame(p, arch.path.pointAt(p), performance.now() / 1000);
      };

      /*
       * Everything that depends on a measurement. The cards are placed by CSS; this reads
       * where they landed and puts the arch, the stage and the scene around them. In flow
       * the arch area is the space; on a desktop it is the whole figure.
       */
      const layout = () => {
        W = area.clientWidth;
        H = area.clientHeight;
        if (W < 1 || H < 1) return; // not laid out: display none, or jsdom
        if (strokeCtx) {
          strokeCanvas.width = W * DPR;
          strokeCanvas.height = H * DPR;
          strokeCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        let rect: Rect;
        if (window.matchMedia(FLOW).matches) {
          arch = phoneArch(W, H);
          rect = phoneStage(arch, W, H);
          surfaces = arch.surfaces(0);
        } else {
          arch = desktopArch(W, H);
          const fig = figure.getBoundingClientRect();
          const [left, top, right] = cards.map((c) => c.getBoundingClientRect());
          rect = desktopStage(W, H, top.bottom - fig.top, right.left - left.right);
          surfaces = arch.surfaces((left.top + left.bottom) / 2 - fig.top);
        }
        const size = [rect.left, rect.top, rect.width, rect.height].map((v) => `${Math.round(v)}px`);
        const changed = stage.style.width !== size[2] || stage.style.height !== size[3];
        [stage.style.left, stage.style.top, stage.style.width, stage.style.height] = size;
        // The renderer fitted the tree to whatever size the stage had before; tell it.
        if (changed) tree?.refit();
        scene?.layout({ W, H, arch, stage: rect });
        draw();
        if (settled) scene?.settle();
      };

      let rt = 0;
      const onResize = () => {
        window.clearTimeout(rt);
        rt = window.setTimeout(() => { fitMark(mark); layout(); }, 300);
      };
      window.addEventListener('resize', onResize);
      const stop = () => {
        dead = true;
        window.removeEventListener('resize', onResize);
        window.clearTimeout(rt);
        tree?.destroy();
        ink?.destroy();
        scene?.destroy();
      };

      if (reduced) tree?.setT(99);
      // Hide the cards here — in JS, so a failed script leaves the copy visible — never in CSS.
      else gsap.set(cards, { opacity: 0, y: 16 });
      fitMark(mark);
      layout();
      // The cards are measured, and the web font changes their height: again when it lands.
      document.fonts.ready.then(() => { if (!dead) { fitMark(mark); layout(); } });

      if (reduced) return stop;

      /*
       * The tree opens by itself on a clock, and the arch is drawn on the same clock with
       * the tree's pen: `p` is how far the pen has come, and the scene shows the sky
       * where it has passed. Each card surfaces as the pen reaches its flank, once —
       * glass sliding into place in the stroke's wake, not a stagger.
       */
      const growth = { T: 0 };
      let arrived = false;
      const arrive = () => {
        if (arrived) return;
        arrived = true;
        gsap.to(growth, {
          T: GROW, duration: OPEN, ease: EASE.none,
          onUpdate: () => {
            T = growth.T;
            tree?.setT(T);
            draw();
            const p = T / GROW;
            cards.forEach((card, i) => {
              if (shown[i] || p < surfaces[i] + 0.004) return;
              shown[i] = true;
              gsap.to(card, { y: 0, opacity: 1, duration: 0.9, ease: EASE.out });
            });
          },
          onComplete: () => { settled = true; scene?.settle(); },
        });
      };

      ScrollTrigger.create({
        trigger: section, start: 'top 78%', once: true, refreshPriority: 1,
        onEnter: arrive,
        /*
         * Landing here from a reload rather than scrolling in: the browser restores the
         * scroll position, the start is already behind us, and `onEnter` has nothing left
         * to fire on — so the cards would keep the opacity 0 set above, invisible and
         * permanently so. Hidden on purpose and hidden by accident look identical.
         *
         * Measured on refresh, never at creation. The hero builds its pin inside
         * `document.fonts.ready`, which resolves after this effect runs, so at creation
         * every position below the hero is a screen short and this would fire for a
         * visitor who is still up in the film.
         */
        onRefresh: (self) => { if (self.progress > 0) arrive(); },
      });

      // The wordmark waits for the header to actually be over us. At the section's own
      // arrival it is still down the screen, and the header is on the hero's dark film
      // where navy on #0b1118 is ~1.5:1 — invisible. The hero pins on phones too and
      // leaves data-on-dark="true" behind, so the handoff belongs at `top top` (spec 9).
      ScrollTrigger.create({
        trigger: section, start: 'top top', refreshPriority: 1,
        onEnter: () => setWordmarkOnDark(false),
        onEnterBack: () => setWordmarkOnDark(false),
        // A resize re-runs the hero's onUpdate, which would repaint the wordmark white
        // over our white section; say it once more while we hold the header.
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(false); },
      });

      return stop;
    },
    { scope: root },
  );

  return (
    <section ref={root} id="visjon" className={styles.vision} aria-labelledby="visjon-label">
      <div className={`${wash.box} ${wash.cave}`} aria-hidden="true">
        <canvas className={wash.paint} data-ink />
      </div>
      {/* Inset exactly as the box is, so 16px from this edge is 16px inside the ink. */}
      <div className={styles.figure} data-figure>
        <p id="visjon-label" className={styles.label}>{site.vision.label}</p>
        {/* The arch and what is inside it: the sky, the stroke, the tree with the name under its roots. */}
        <div className={styles.arch} data-arch>
          <canvas className={styles.layer} data-scene aria-hidden="true" />
          <canvas className={styles.layer} data-stroke aria-hidden="true" />
          <Tree />
        </div>
        {/* The three values, on glass: Dialog on the left flank, Trygghet on the apex, Inkludering on the right. */}
        {site.vision.values.map((v, i) => (
          <div key={v.key} className={`${styles.slot} ${SLOTS[i]}`}>
            <div className={`${wash.card} ${styles.value}`} data-value={v.key}>
              <h2 className={styles.name}>{v.name}</h2>
              <p className={styles.text}>{v.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: The stylesheet**

Replace `components/vision/vision.module.css`:

```css
/*
 * The arch before sunrise. One box of cave ink; over it, an arch drawn with the tree's pen
 * as the tree grows, the sky opening inside it in the pen's wake, and three glass cards —
 * Dialog on the left flank, Trygghet on the apex, Inkludering on the right — with the tree
 * standing in the column between them and the name under its roots.
 *
 * The cards are placed here, in CSS. The arch, the tree's stage and the scene are placed in
 * JS from where the cards landed (Vision.tsx, `layout`). The numbers are the mock's; the
 * spec says which are not: docs/superpowers/specs/2026-09-11-visjon-buen-design.md.
 */
.vision {
  position: relative;
  background: transparent;
  overflow: hidden;
  height: 100svh;
  min-height: 640px;
}

/*
 * Everything the section holds, positioned against the box rather than the section: the
 * same inset as `.box` in wash.module.css, so 16px from this edge is 16px inside the ink.
 */
.figure {
  position: absolute;
  inset: var(--box-inset-y) var(--box-inset-x);
  z-index: 1;
}

.label {
  position: absolute;
  left: 52px;
  top: 62px;
  margin: 0;
  font: 500 12px/1 var(--font-sans);
  letter-spacing: 0.03em;
  color: var(--color-ink-soft);
}

/* The arch and what is inside it. On a desktop it is the whole figure. */
.arch {
  position: absolute;
  inset: 0;
}

/* The scene and the stroke: two canvases the size of the arch area, under the tree. */
.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

/*
 * The tree's stage. JS sizes and places it from the cards' measured positions; this is the
 * rest it has before that runs, near where it ends up at 1440×900.
 */
.stage {
  position: absolute;
  left: calc(50% - 400px);
  width: 800px;
  top: 25%;
  height: 70%;
}

.canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/*
 * The name under the roots: the hero's lockup, small. IQRA tight, FOUNDATION tracked out
 * to its width by JS (`fitMark`). The renderer sets `top` and fades it in with the roots.
 */
.mark {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

.markFirst {
  font-weight: 700;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.05em;
  margin-right: -0.05em;
  color: var(--color-navy);
}

.markSecond {
  font-weight: 600;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.42em;
  margin-right: -0.42em;
  color: var(--color-ink-soft);
}

/*
 * Where the cards go. Each card stands in a slot: the slot is positioned and centres the
 * card with flex rather than a transform, because GSAP moves the card by its transform
 * when it surfaces and would overwrite a `translateY(-50%)` set here.
 *
 * The side slots run from the top of the figure to 10% above its foot, so their middle —
 * where the card is — is at 0.45H. The top slot is a row across the figure, 30px down:
 * just under the header's haze when the section is at the top of the screen; any higher
 * and the name goes under it.
 */
.slot {
  position: absolute;
  display: flex;
  pointer-events: none;
}

.slotLeft,
.slotRight {
  top: 0;
  height: 90%;
  align-items: center;
  width: clamp(300px, 27.5%, 350px);
}

.slotLeft {
  left: 16px;
}

.slotRight {
  right: 16px;
}

.slotTop {
  left: 0;
  right: 0;
  top: 30px;
  justify-content: center;
}

/*
 * The card: 350px on the flanks and 440px on the apex at 1440 — a lintel over two posts,
 * wider and shorter so the crown keeps its room under it. Under 1273px of viewport both
 * shrink toward 300 and 380, which the mock never showed, and the tree's stage is capped
 * to the column they leave (arch.ts, `desktopStage`).
 */
.value {
  width: 100%;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 26px 28px 28px;
}

.slotTop .value {
  width: clamp(380px, 34.6%, 440px);
}

.name {
  margin: 0;
  font-size: 28px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--color-navy);
}

.text {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-ink-soft);
}

/*
 * Under 1100px the section flows: the arch keeps the top of it with the tree inside, and
 * the cards stack under it on the same ink. 1100 is where this section's grid already
 * broke before the phone breakpoint did anything, and between there and the mock's 700
 * two 350px cards would leave the tree a 60px column.
 *
 * The box's inset becomes fixed pixels here and the section pads by the same pixels: a
 * percentage padding resolves against the width on all four sides, so it cannot match a
 * percentage inset, and this is the one layout where the figure gives the section its
 * height rather than filling it. The 26px at the foot is 12px of ink under the last card,
 * the same as the gap between cards.
 */
@media (max-width: 1099px) {
  .vision {
    --box-inset-x: 10px;
    --box-inset-y: 14px;
    height: auto;
    min-height: 0;
    padding: 14px 10px 26px;
  }

  .figure {
    position: relative;
    inset: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .label {
    top: 100px;
  }

  .arch {
    position: relative;
    inset: auto;
    /* 70svh, and never so short that the arch has no legs and the tree no room. */
    height: max(70svh, 420px);
  }

  .slot {
    position: static;
    display: block;
    height: auto;
    width: auto;
    padding: 0 12px;
  }

  .value,
  .slotTop .value {
    width: auto;
    padding: 22px 22px 24px;
  }

  .name {
    font-size: 24px;
  }

  .text {
    font-size: 14.5px;
  }
}

@media (max-width: 767px) {
  .label {
    left: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mark {
    opacity: 1;
  }
}
```

- [ ] **Step 7: Run the unit tests, the types, the lint, and the content check**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx vitest run && npx tsc --noEmit && npm run lint && node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-content.mjs`
Expected: all green — Vision.test.tsx 2 tests; the content check prints `content ok, with N placeholders still in place` (the same N as on main; none of them in `vision`). If `e2e/sections.spec.ts` fails to type-check on `site.vision.tree.limbs`, that is Task 5's job — `tsc` covers `e2e/` too, so expect that one error here and confirm it is the only one.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && git add content/site.no.ts components/vision/TreeFigure.tsx components/vision/Vision.tsx components/vision/vision.module.css components/vision/Vision.test.tsx && git commit -q -F - <<'EOF'
vision: the arch before sunrise — three cards around the tree, the sky inside the stroke

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 5: the e2e — cards instead of lines

**Files:**
- Modify: `e2e/sections.spec.ts` (`treeHasInk` ~line 44, `TREE_NAMES` line 90, the desktop test at ~158, the fit test at ~179, the resize test at ~196, the phone test at ~430, the phone fit test at ~541)

**Interfaces:**
- Consumes: the DOM contract from Task 4; `site.vision.values`.

- [ ] **Step 1: Generalise the paint sampler and drop `TREE_NAMES`**

Replace the `treeHasInk` helper and its comment:

```ts
/**
 * Anything drawn at all on a canvas, sampled across the whole of it rather than down one
 * column: the tree is a line drawing and a single column of pixels can miss it honestly.
 *
 * Scoped by the caller — `#visjon canvas` alone matches the ink first, which is WebGL:
 * `getContext('2d')` on it returns null, and the query would not fail, it would throw
 * somewhere that reads like the tree being broken.
 */
const canvasHasPaint = (page: Page, selector: string) => page.evaluate((sel) => {
  const c = document.querySelector(sel) as HTMLCanvasElement;
  const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  for (let y = 0; y < c.height; y += 3) {
    for (let x = 0; x < c.width; x += 3) if (data[(y * c.width + x) * 4 + 3] > 40) return true;
  }
  return false;
});
const treeHasInk = (page: Page) => canvasHasPaint(page, '#visjon [data-tree] canvas');
```

Delete the `TREE_NAMES` constant and its comment. Add, in its place:

```ts
/** The three cards around the tree, from the content file, so renaming a value there does
 *  not leave a test asserting a name nothing renders. */
const VALUE_CARDS = site.vision.values.map((v) => `#visjon [data-value="${v.key}"]`);
```

- [ ] **Step 2: The desktop arrival test**

Replace the test `desktop: visjon does not pin; the lines arrive, the tree opens, the box holds ink` (and its comment) with:

```ts
/**
 * The tree used to be scrubbed by a pin here, and this test scrolled through the pin to
 * open it. It runs on a clock now, so arriving IS the interaction — nothing below scrolls
 * a pixel after the first line, and what follows is what arriving has to be worth: the
 * arch drawn, the sky inside it, the three cards surfaced in its wake, the name under the
 * roots.
 */
test('desktop: visjon does not pin; the cards surface, the tree opens, the sky is painted, the box holds ink', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the arch with the cards on its flanks is the desktop layout');
  await pastHero(page);
  const top = await docTop(page, '#visjon');
  await page.evaluate((y) => window.scrollTo(0, y + 10), top);
  // Generous, because this is a 3s tween finishing on its own and not a scroll we drive.
  for (const card of VALUE_CARDS) {
    await expect(page.locator(card)).toHaveCSS('opacity', '1', { timeout: 12_000 });
  }
  await expect(page.locator('#visjon [data-root]')).toHaveCSS('opacity', '1', { timeout: 12_000 });
  expect(await treeHasInk(page)).toBe(true);
  expect(await canvasHasPaint(page, '#visjon [data-scene]'), 'the sky never opened inside the arch').toBe(true);
  expect(await canvasHasPaint(page, '#visjon [data-stroke]'), 'the arch was never drawn').toBe(true);
  await boxIsPainted(page, 'visjon', film.vision.ground);
  await expect(wordmark(page)).toHaveAttribute('data-on-dark', 'false');
  await expect(page.locator('.pin-spacer')).toHaveCount(1); // the section holds nothing
});
```

- [ ] **Step 3: Drop the desktop fit test; keep the resize test and add the cards-in-box check**

Delete the test `desktop: visjon’s hand-set lines each fit on one line` and its comment (Visjon has no hand-set lines now; Misjon's are covered by the phone fit test below).

In `desktop: a resize on Visjon keeps the wordmark navy and the tree on screen`, after the final `expect(await treeHasInk(page), …)`, add:

```ts
  // The cards are placed by CSS and the stage by JS from where they landed; after a resize
  // both have to agree — every card inside the figure, and the stage inside the column.
  const inside = await page.evaluate(() => {
    const fig = document.querySelector('#visjon [data-figure]')!.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('#visjon [data-value]')).map((c) => c.getBoundingClientRect());
    const stage = document.querySelector('#visjon [data-tree]')!.getBoundingClientRect();
    return cards.every((r) => r.left >= fig.left - 1 && r.right <= fig.right + 1)
      && stage.bottom <= fig.bottom + 1 && stage.top >= cards[1].bottom;
  });
  expect(inside, 'a card left the box, or the stage overlaps the top card').toBe(true);
```

- [ ] **Step 4: The phone test**

In `phone: no pins after the hero; the tree grows and every section stays legible`, replace the block

```ts
  for (const name of TREE_NAMES) {
    await expect(page.locator('#visjon [data-limb], #visjon [data-root]').filter({ hasText: name })).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }
```

with

```ts
  for (const card of VALUE_CARDS) {
    await expect(page.locator(card)).toHaveCSS('opacity', '1', { timeout: 8_000 });
  }
  await expect(page.locator('#visjon [data-root]')).toHaveCSS('opacity', '1', { timeout: 8_000 });
  // In flow the arch keeps the top of the section and the cards stack under it, on the
  // same ink: every card starts below the arch area, and the box reaches the last one.
  const stacked = await page.evaluate(() => {
    const arch = document.querySelector('#visjon [data-arch]')!.getBoundingClientRect();
    const box = document.querySelector('#visjon canvas[data-ink]')!.parentElement!.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('#visjon [data-value]')).map((c) => c.getBoundingClientRect());
    return cards.every((r) => r.top >= arch.bottom - 1 && r.bottom <= box.bottom + 1);
  });
  expect(stacked, 'a card overlaps the arch or hangs out of the box').toBe(true);
```

- [ ] **Step 5: The phone fit test loses its Visjon half**

In `phone: no hand-set line runs out of its card`, change the selector `'#visjon [data-line], #misjon [class*="line"]'` to `'#misjon [class*="line"]'`, and its comment to:

```ts
/** Misjon's hand-set lines shrink faster than the desktop clamp on a phone, or they run
 *  out of the card — this is the width that actually breaks it. Visjon has no hand-set
 *  lines since the arch. */
```

- [ ] **Step 6: Type-check, then run the e2e**

First make sure nothing is listening on 3000 — Playwright reuses a running server and would test whatever that server is serving:

Run: `netstat -ano | grep -c ":3000 .*LISTENING"`
Expected: `0`. If not, find the process (`netstat -ano | grep ":3000 .*LISTENING"`, then `tasklist /FI "PID eq <pid>"`), read its command line before touching it, and stop it only if it is a stray `next start` — never anything else.

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && npx tsc --noEmit && npm run e2e 2>&1 | tail -40`
Expected: tsc clean; the suite green (58 tests on main; this branch changes three and removes one). The build inside `npm run e2e` takes a few minutes. If the Visjon tests fail, read the failure before touching the assertion: `toHaveCSS('opacity', '1')` on a card failing means the card never surfaced — check `surfaces` and the tween — and `canvasHasPaint` on `[data-scene]` failing means `layout` never ran with a size, or `region()` threw.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && git add e2e/sections.spec.ts && git commit -q -F - <<'EOF'
e2e: Visjon is three cards around an arch, not four lines

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 6: look at it — screenshots beside the mock, and a frame time

**Files:**
- Create (scratchpad, not the repo): `<scratchpad>/shoot-buen.mjs`
- Output: `<scratchpad>/shots/buen-{desktop2x,laptop,narrow,phone}.png`, `<scratchpad>/shots/timing.txt`

**Interfaces:**
- Consumes: the built site (`npm run build` from Task 5's e2e is enough; `next start` on a port of its own).

- [ ] **Step 1: Write the shoot script**

`<scratchpad>` is `C:\Users\daodi\AppData\Local\Temp\claude\C--Users-daodi-code-iqra-foundation\5e3468ee-6fe6-44d4-87ab-6ec10e08dc32\scratchpad`. Write it with the Write tool (heredocs mangle quotes and backslashes; see memory). The script owns its server's lifecycle: it starts `next start` on 3111, shoots, kills it, and checks the port is free.

```js
// Shoots the built site's Visjon at four sizes on the real GPU, and times the settled
// scene. Run from anywhere: `node shoot-buen.mjs`. Serves the worktree's build on 3111.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';

const REPO = 'C:/Users/daodi/code/iqra-foundation-buen';
const require = createRequire(REPO + '/package.json');
const { chromium } = require('playwright');
const out = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'shots');
fs.mkdirSync(out, { recursive: true });
const PORT = 3111;

const listening = () => new Promise((r) => { const s = net.createConnection({ port: PORT, host: '127.0.0.1' }); s.on('connect', () => { s.end(); r(true); }); s.on('error', () => r(false)); });
if (await listening()) throw new Error(`something is already on ${PORT}; not mine to use`);
const server = spawn('npx', ['next', 'start', '-p', String(PORT)], { cwd: REPO, shell: true, stdio: 'ignore' });
for (let i = 0; i < 60 && !(await listening()); i++) await new Promise((r) => setTimeout(r, 500));
if (!(await listening())) { server.kill(); throw new Error('next start never listened'); }

const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const sizes = [
  ['desktop2x', 1440, 900, 2, false],
  ['laptop', 1366, 768, 1, false],
  ['narrow', 1120, 700, 1, false],
  ['phone', 390, 844, 3, true],
];
const lines = [];
for (const [name, w, h, dpr, mobile] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => lines.push(`${name}: PAGE ERROR ${String(e).slice(0, 200)}`));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // past the hero's pin, then to Visjon's top
  await page.waitForTimeout(800);
  await page.evaluate(() => { const el = document.getElementById('visjon'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 10); });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(out, `buen-${name}.png`), animations: 'disabled' });
  if (name === 'desktop2x') {
    // rAF deltas are vsync-quantised: compare the settled scene against the same page with
    // the scene hidden, never quote either level on its own.
    const measure = () => page.evaluate(() => new Promise((res) => {
      const ds = []; let last = performance.now(); let n = 0;
      const f = (t) => { ds.push(t - last); last = t; if (++n < 180) requestAnimationFrame(f); else res(ds); };
      requestAnimationFrame(f);
    }));
    const stat = (ds) => { const s = [...ds].sort((a, b) => a - b); return `mean ${(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(2)}ms p95 ${s[Math.floor(s.length * 0.95)].toFixed(2)}ms`; };
    const withScene = await measure();
    await page.evaluate(() => { document.querySelector('#visjon [data-scene]').style.display = 'none'; });
    await page.waitForTimeout(300);
    const without = await measure();
    lines.push(`desktop2x frame, scene settled: ${stat(withScene)}`);
    lines.push(`desktop2x frame, scene hidden:  ${stat(without)}`);
  }
  await ctx.close();
}
await browser.close();
server.kill();
// `shell: true` makes the child a cmd.exe; make sure the server it started is gone too.
for (let i = 0; i < 20 && (await listening()); i++) await new Promise((r) => setTimeout(r, 250));
lines.push(`port ${PORT} free after: ${!(await listening())}`);
fs.writeFileSync(path.join(out, 'timing.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
```

- [ ] **Step 2: Build if the e2e did not, then shoot**

Run: `cd /c/Users/daodi/code/iqra-foundation-buen && ls .next/BUILD_ID && node <scratchpad>/shoot-buen.mjs`
Expected: four PNGs and `timing.txt`; no `PAGE ERROR` lines; `port 3111 free after: true`. If the port is not free, find the `node`/`next` process on 3111 and stop it — read its command line first.

- [ ] **Step 3: Look, against the mock**

Open each PNG with the Read tool and compare with `C:\Users\daodi\code\iqra-mocks\2026-09-11-visjon-buen\shots\g-desktop2x-small.png` and `g-phone.png`:

- desktop2x: the arch's feet at the box's bottom corners, the apex under the top card; sky deep at the top with stars, cream at the horizon; grass along the ground line, the whole width of the opening, none below it; brown earth with four faint strata; IQRA / FOUNDATION under the roots, FOUNDATION as wide as IQRA; the crown clear of both side cards; the top card's name under the header's haze but readable.
- laptop and narrow: the same picture smaller; the crown must not sit under the glass of a side card (the cap), the cards must not touch each other.
- phone: the arch with legs, the tree inside it, the cards stacked under it on the ink, nothing wider than the screen.

Anything off is a bug in Task 2, 3 or 4 — fix it there with its test, rerun that task's tests, and shoot again. Do not tune numbers to taste; the numbers are the user's.

- [ ] **Step 4: Send the pictures**

Send the four PNGs and the two timing lines to the user with SendUserFile, the desktop first. State the frame cost as the difference between the two measurements, and say plainly if it is more than the ink's share of a frame (the ink was measured at roughly 3–4ms on this GPU).

---

### Task 7: the gate, the memory, and the PR

**Files:**
- Modify: `C:\Users\daodi\.claude\projects\C--Users-daodi-code-iqra-foundation\memory\iqra-visjon-treet-tre-bokser.md` (the state at the top) and `MEMORY.md` (its line)

- [ ] **Step 1: Run everything**

Run, from the worktree, in this order, and stop at the first red:

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && npx tsc --noEmit && npm run lint && npm test 2>&1 | tail -6 && npm run build 2>&1 | tail -12
```

Then confirm nothing is on 3000 (`netstat -ano | grep -c ":3000 .*LISTENING"` must print `0`; Playwright reuses a running server and would test whatever it serves) and run `npm run e2e 2>&1 | tail -20`, then `npm run lhci 2>&1 | tail -30` (read `lighthouserc.json` first for how it serves the page; it may need the build and a free port too). Expected: all green; Lighthouse performance ≥ 0.90, accessibility ≥ 0.95, CLS ≤ 0.05.

- [ ] **Step 2: Say what else you would change, before the PR**

In chat, before opening the PR, list every recommendation being held — copy that reads wrong, a rough edge seen in the screenshots, an assumption the user might veto (the 1100 line, the card shrink, the 26px foot in flow, the `h2`s). Say "nothing else outstanding" if that is true. This is the batch's last chance to grow; after the merge every addition is a second deploy.

- [ ] **Step 3: Push and open the PR**

```bash
cd /c/Users/daodi/code/iqra-foundation-buen && git push -u origin feat/visjon-buen && gh pr create --base main --head feat/visjon-buen --title "Visjon: the arch before sunrise" --body-file - <<'EOF'
The Visjon section rebuilt as the mockup's look G: one arch drawn across the cave ink with the tree's pen as the tree grows, the pre-dawn sky opening inside it in the pen's wake — stars, the first light, grass on the surface, the earth with the roots in it — and three glass cards around the tree: Dialog, Trygghet, Inkludering, with IQRA FOUNDATION under the roots. The vision headline leaves the section (kept in the content file for Misjon).

Spec: docs/superpowers/specs/2026-09-11-visjon-buen-design.md. Plan: docs/superpowers/plans/2026-09-11-visjon-buen.md.

Departures from the mock, each in the spec: cards shrink toward 300/380px under 1273px of viewport and the tree is capped to the column between them; the section flows under 1100px rather than 700; the scene's loop pauses off screen; the arch's angles are normalised (the mock's arc went under the floor on a 1440×700 window).

Verified: tsc, eslint, vitest, next build, playwright (desktop + phone), lhci; screenshots on the real GPU at 1440×900@2, 1366×768, 1120 wide, 390×844@3.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
gh pr view --json number,changedFiles,additions,deletions,commits --jq '{number, changedFiles, additions, deletions, commits: (.commits | length)}'
```

Expected: the PR's `changedFiles` is 15 — the spec, the plan, tree.ts, tree.test.ts, arch.ts, arch.test.ts, dawn.ts, dawn.test.ts, vitest.setup.ts, site.no.ts, TreeFigure.tsx, Vision.tsx, vision.module.css, Vision.test.tsx, sections.spec.ts — matching `git diff --stat origin/main | tail -1`, and its commits are this branch's only. Numbers that do not match mean the base is wrong; close and reopen rather than force-push.

- [ ] **Step 4: Bind the PR and watch CI**

Use `mcp__ccd_pr__bind_pr` with the PR number, then `mcp__ccd_pr__get_status` for CI. Report the outcome as it is.

- [ ] **Step 5: Update memory**

Rewrite the "STATE AT HANDOFF" block at the top of `iqra-visjon-treet-tre-bokser.md`: the PR number and whether it is merged, the branch and worktree, what shipped, the departures, and what is still open (the header haze, real copy, the headline's move to Misjon). Update the line for it in `MEMORY.md`. Add nothing to memory that the repo now records.
