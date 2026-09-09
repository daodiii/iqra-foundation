/**
 * Ink in still water.
 *
 * A Navier-Stokes solver on the GPU — the standard Stam split, all of it in fragment
 * shaders on a full-screen quad: add force, confine vorticity, project out divergence with
 * a Jacobi pressure solve, then advect velocity and dye through the field. Drops fall on
 * their own so the page is never still; the pointer drags a line of pigment through it.
 *
 * The reason it is a real fluid rather than a loop of noise is that this is the page's one
 * moment of spectacle, and noise reads as a screensaver the moment you move the mouse
 * across it and nothing happens. The cost is a WebGL2 context per section, which is why
 * `createInk` is written to be skippable: it returns null on any device that cannot run it,
 * and the CSS ground underneath is a complete, static answer.
 */

export type RGB = [number, number, number];

/** A pigment and how often it is laid down, relative to the others in the palette. */
export type Pigment = readonly [hex: string, weight: number];

export type InkPalette = {
  /**
   * The pigments, in no particular order.
   *
   * Weights are load-bearing, and this is the one thing about the palette that is easy to
   * get wrong. Pigment mixes SUBTRACTIVELY: two inks from opposite sides of the wheel make
   * mud, not a gradient. The first pass at this palette gave every ink equal weight and
   * three boxes came out the same grey-brown. So each palette holds to one scene's hue
   * family, and the darks — which have the most power to kill the others — appear once
   * against the mid-tones' three.
   */
  ink: readonly Pigment[];
  /** The paper, or, when `additive`, the water. Also set as the box background in CSS. */
  ground: string;
  /**
   * Light in dark water rather than pigment on paper. The night card at the foot of Støtt
   * oss is the only one: white type sits on it, so its ink has to add light to the ground
   * instead of taking it away.
   */
  additive?: boolean;
  /** Overall pigment load. Below 1 the ink is thinner, above 1 it stains harder. */
  strength?: number;
};

export type InkHandle = {
  destroy(): void;
  /** Drop a ring of pigment and push the water out from it. Coordinates are 0-1, y up. */
  stir(x: number, y: number): void;
};

export type InkOptions = {
  reduced: boolean;
  palette: InkPalette;
  /**
   * The element the pointer is tracked on — the box, not the canvas, so the water answers a
   * hand moving over the copy as well as over the colour. Omitted, the ink only drifts.
   */
  host?: HTMLElement | null;
};

const hexToRgb = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/**
 * How much of a pigment's common absorbance to take out, 0 to 1.
 *
 * A colour sampled from a photograph absorbs nearly as much red as it does blue — that is
 * what makes it a mid-tone rather than a hue — and a filter that absorbs everything equally
 * is a neutral density filter: it darkens without colouring. Mixed straight, these pigments
 * gave a box of grey smoke that happened to be very slightly blue.
 *
 * A real dye is selective. Taking out the part of the absorbance common to all three
 * channels leaves the part that actually is a colour, so the ink can be light AND blue
 * rather than having to choose. The hue is untouched: the same amount comes off each
 * channel, so the differences that make the hue survive intact.
 */
const PURITY = 0.55;

/** The selective part of a pigment's absorbance. See `PURITY`. */
export function purify(absorbance: RGB): RGB {
  const common = Math.min(...absorbance) * PURITY;
  return absorbance.map((v) => Math.max(0, v - common)) as RGB;
}

/**
 * Expand the weighted pigments into the order they will actually be laid down in.
 *
 * Not `[a,a,a,b]` — three drops of the same colour in a row read as one big blot, and the
 * palette stops looking like a palette. Each pigment's k-th drop is given the position
 * `(k + 0.5) / weight` along the cycle and the whole lot is sorted, which spreads every
 * colour as evenly as its weight allows. Ties go to the heavier pigment, so the sequence is
 * deterministic: a shuffle here would make the first frame of every section different, and
 * a test of it flaky.
 */
export function pigmentCycle(palette: InkPalette): RGB[] {
  const slots = palette.ink.flatMap(([hex, weight]) =>
    Array.from({ length: Math.max(1, weight) }, (_, k) => ({
      at: (k + 0.5) / Math.max(1, weight),
      weight,
      hex,
    })),
  );
  slots.sort((a, b) => a.at - b.at || b.weight - a.weight);
  return slots.map((s) => hexToRgb(s.hex));
}

/*
 * The shaders. `H` is the shared preamble: WebGL2 (`#version 300 es` must be the first line
 * of the source, so these are template literals with no leading newline), and the four
 * neighbour lookups the stencils need, computed once in the vertex shader rather than three
 * times per fragment.
 */
const VERT = `#version 300 es
precision highp float; layout(location = 0) in vec2 p; out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB; uniform vec2 texel;
void main(){ vUv = p * .5 + .5; vL = vUv - vec2(texel.x, 0.); vR = vUv + vec2(texel.x, 0.); vT = vUv + vec2(0., texel.y); vB = vUv - vec2(0., texel.y); gl_Position = vec4(p, 0., 1.); }`;

const H = `#version 300 es
precision highp float; precision highp sampler2D; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; out vec4 o;`;

const FRAG = {
  /** A gaussian blob of velocity or dye, added to whatever is already there. */
  splat: `${H}uniform sampler2D uTarget; uniform float aspect; uniform vec2 point; uniform vec3 color; uniform float radius;
    void main(){ vec2 p = vUv - point; p.x *= aspect; vec3 s = exp(-dot(p, p) / radius) * color; o = vec4(texture(uTarget, vUv).xyz + s, 1.); }`,
  /** Semi-Lagrangian: look back along the velocity to see what arrives here. */
  advect: `${H}uniform sampler2D uVel; uniform sampler2D uSrc; uniform vec2 texel; uniform float dt; uniform float diss;
    void main(){ vec2 c = vUv - dt * texture(uVel, vUv).xy * texel; o = texture(uSrc, c) / (1. + diss * dt); }`,
  /** Free-slip walls: the boundary reflects the normal component back. */
  div: `${H}uniform sampler2D uVel;
    void main(){ float L = texture(uVel, vL).x, R = texture(uVel, vR).x, T = texture(uVel, vT).y, B = texture(uVel, vB).y; vec2 C = texture(uVel, vUv).xy;
      if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y; o = vec4(.5 * (R - L + T - B), 0., 0., 1.); }`,
  curl: `${H}uniform sampler2D uVel;
    void main(){ float L = texture(uVel, vL).y, R = texture(uVel, vR).y, T = texture(uVel, vT).x, B = texture(uVel, vB).x; o = vec4(.5 * (R - L - T + B), 0., 0., 1.); }`,
  /** Vorticity confinement: puts back the small eddies the advection step smears away. */
  vort: `${H}uniform sampler2D uVel; uniform sampler2D uCurl; uniform float curl; uniform float dt;
    void main(){ float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
      vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= curl * C; f.y *= -1.;
      vec2 v = texture(uVel, vUv).xy + f * dt; o = vec4(clamp(v, -1000., 1000.), 0., 1.); }`,
  press: `${H}uniform sampler2D uP; uniform sampler2D uDiv;
    void main(){ float L = texture(uP, vL).x, R = texture(uP, vR).x, T = texture(uP, vT).x, B = texture(uP, vB).x, C = texture(uDiv, vUv).x; o = vec4((L + R + B + T - C) * .25, 0., 0., 1.); }`,
  grad: `${H}uniform sampler2D uP; uniform sampler2D uVel;
    void main(){ float L = texture(uP, vL).x, R = texture(uP, vR).x, T = texture(uP, vT).x, B = texture(uP, vB).x; vec2 v = texture(uVel, vUv).xy - vec2(R - L, T - B); o = vec4(v, 0., 1.); }`,
  clear: `${H}uniform sampler2D uTex; uniform float value; void main(){ o = value * texture(uTex, vUv); }`,
  /**
   * Dye to picture. Subtractive by default — Beer-Lambert, so thick ink darkens towards
   * black the way a real wash does instead of clipping to a flat colour — and additive for
   * the night card. The dither is not decoration: at these gradients an 8-bit framebuffer
   * bands visibly, and a half-LSB of noise costs nothing and removes it.
   */
  show: `${H}uniform sampler2D uDye; uniform vec3 ground; uniform float t; uniform float additive;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec3 d = texture(uDye, vUv).rgb;
      vec3 col = additive > .5 ? min(ground + d, vec3(1.)) : ground * exp(-d * 1.85);
      col += (hash(gl_FragCoord.xy + fract(t)) - .5) * (2. / 255.); o = vec4(col, 1.); }`,
} as const;

type FragName = keyof typeof FRAG;

/** Jacobi iterations for the pressure solve. Below about ten the flow visibly loses swirl. */
const PRESSURE_STEPS = 10;
/**
 * Seconds between simulation steps.
 *
 * Ink spreading through water is a slow event, and stepping it thirty times a second looks
 * identical to stepping it sixty — this is not an animation whose smoothness anyone reads,
 * it is a field that drifts. Halving the rate halves the cost of the most expensive thing
 * on the page, which is what makes several of these affordable at once.
 *
 * A touch under 1/30 so a display running at exactly 30Hz does not alternate between one
 * step and none, which reads as a stutter where a steady half-rate does not.
 */
const STEP_EVERY = 0.031;
/** The canvas is drawn at half CSS resolution and scaled up; the field has no edges to soften. */
const DRAW_SCALE = 0.5;
/** Simulation grid along the short side. Dropped on phones, where the box is small anyway. */
const SIM_BASE = 144;
const SIM_BASE_SMALL = 112;
const NARROW = 500;
/** Seconds between ambient drops, plus a random part of the same size. */
const DROP_EVERY = 0.9;
/**
 * Steps run before the first paint.
 *
 * This is the number that decides what the section looks like when you arrive at it, which
 * is the only view most people get: the simulation is paused until the box is on screen, so
 * it cannot rely on having run for a while. Too few and the seeding drops are still
 * separate blobs of neat pigment — dark, round, and obviously not a fluid. These are enough
 * for them to meet, fold into each other and thin out.
 */
const SETTLE_STEPS = 84;
/**
 * How much of the settle happens before the first frame is shown, and how much is spread
 * over the frames after it.
 *
 * All of it at once is a stall of a few hundred milliseconds on a real GPU and well over a
 * second under software rendering — and it lands at the exact moment the section arrives,
 * which is when its copy is supposed to be animating in. Misjon's entrance was still at
 * three per cent opacity five seconds after it should have finished, because the ink was
 * holding the main thread. So the picture is made good enough to show in one burst, and the
 * rest of the blooming is paid for a few steps at a time while the page is already moving.
 */
const SETTLE_FIRST = 12;
const SETTLE_PER_FRAME = 5;

export function createInk(canvas: HTMLCanvasElement, opts: InkOptions): InkHandle | null {
  const context = canvas.getContext('webgl2', {
    alpha: false, antialias: false, premultipliedAlpha: false, depth: false, stencil: false,
  });
  if (!context) return null;
  /*
   * Re-declared with the type rather than left to narrowing. The helpers below are function
   * declarations, which are hoisted, so TypeScript reasons about them as if they could run
   * before the check above and hands them the nullable type — a hundred false errors, and
   * no amount of `!` inside them is honest. Giving the binding its type once fixes them all.
   */
  const gl: WebGL2RenderingContext = context;
  /*
   * The dye and velocity fields are half-float textures, and rendering INTO one needs this
   * extension. It is absent on some older mobile GPUs, where the honest answer is to decline
   * and leave the CSS ground showing rather than to render something broken.
   */
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;
  gl.getExtension('OES_texture_float_linear');

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('ink: shader failed', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  if (!vs) return null;
  const programs = {} as Record<FragName, { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }>;
  for (const name of Object.keys(FRAG) as FragName[]) {
    const fs = compile(gl.FRAGMENT_SHADER, FRAG[name]);
    const p = fs && gl.createProgram();
    if (!fs || !p) return null;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    programs[name] = { p, u: {} };
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  type Target = {
    tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number;
    texel: [number, number]; bind(unit: number): number;
  };
  const owned: Target[] = [];

  function target(w: number, h: number, internal: number, format: number): Target | null {
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) return null;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const t: Target = {
      tex, fb, w, h, texel: [1 / w, 1 / h],
      bind(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; },
    };
    owned.push(t);
    return t;
  }

  /** A field that is read and written in the same pass, so it needs two of everything. */
  type Pair = { texel: [number, number]; readonly read: Target; readonly write: Target; swap(): void };
  function pair(w: number, h: number, internal: number, format: number): Pair | null {
    let a = target(w, h, internal, format);
    let b = target(w, h, internal, format);
    if (!a || !b) return null;
    // The two swap by rebinding these locals. Writing to `read`/`write` from outside would
    // silently do nothing — they are getters — so `swap` is the only way round.
    return {
      texel: a.texel,
      get read() { return a as Target; },
      get write() { return b as Target; },
      swap() { const t = a; a = b; b = t; },
    };
  }

  let velocity: Pair | null = null;
  let dye: Pair | null = null;
  let pressure: Pair | null = null;
  let divergence: Target | null = null;
  let curl: Target | null = null;
  let aspect = 1;
  let seeded = false;
  let broken = false;
  /*
   * Set by the ResizeObserver, read by the frame loop. The measurement is deliberately NOT
   * taken every frame: `getBoundingClientRect` forces layout, and four sections each doing
   * it sixty times a second is a self-inflicted bottleneck in the one place on the page that
   * cannot afford one.
   */
  let needsResize = true;

  function resize(): boolean {
    needsResize = false;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(64, Math.round(rect.width * DRAW_SCALE));
    const h = Math.max(64, Math.round(rect.height * DRAW_SCALE));
    if (canvas.width === w && canvas.height === h && dye) return true;
    canvas.width = w;
    canvas.height = h;
    aspect = w / h;
    // Every target is replaced, so the old ones are released here rather than leaked on
    // each resize — four contexts' worth of half-float textures is real memory.
    releaseTargets();
    const base = rect.width < NARROW ? SIM_BASE_SMALL : SIM_BASE;
    const sw = aspect >= 1 ? Math.round(base * aspect) : base;
    const sh = aspect >= 1 ? base : Math.round(base / aspect);
    velocity = pair(sw, sh, gl.RG16F, gl.RG);
    pressure = pair(sw, sh, gl.R16F, gl.RED);
    divergence = target(sw, sh, gl.R16F, gl.RED);
    curl = target(sw, sh, gl.R16F, gl.RED);
    dye = pair(w, h, gl.RGBA16F, gl.RGBA);
    seeded = false;
    if (!velocity || !pressure || !divergence || !curl || !dye) { broken = true; return false; }
    return true;
  }

  function releaseTargets() {
    for (const t of owned) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }
    owned.length = 0;
  }

  const uniform = (name: FragName, u: string) => {
    const prog = programs[name];
    if (!(u in prog.u)) prog.u[u] = gl.getUniformLocation(prog.p, u);
    return prog.u[u];
  };
  const bindProgram = (name: FragName, texel: [number, number]) => {
    gl.useProgram(programs[name].p);
    gl.uniform2f(uniform(name, 'texel'), texel[0], texel[1]);
  };
  const blit = (to: Target | null) => {
    if (to) { gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb); gl.viewport(0, 0, to.w, to.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const additive = !!opts.palette.additive;
  const strength = opts.palette.strength ?? 1;
  const ground = hexToRgb(opts.palette.ground).map((v) => v / 255) as RGB;
  /*
   * Absorbance, not colour: subtractive pigment is what the paper LOSES, so it is stored
   * inverted here and the show pass exponentiates it back. Additive ink is the light itself
   * and needs neither inversion nor purifying — a lamp is already only the colour it emits.
   */
  const pigments = pigmentCycle(opts.palette).map((c) =>
    additive
      ? (c.map((v) => v / 255) as RGB)
      : purify(c.map((v) => 1 - v / 255) as RGB),
  );
  /* Light adds up much faster than pigment subtracts, so the night card takes about half
     the load or the lamps blow out to white. */
  const load = (k: number) => k * strength * (additive ? 0.55 : 1);
  let pigmentAt = 0;
  const nextPigment = () => pigments[pigmentAt++ % pigments.length];

  function splat(x: number, y: number, dx: number, dy: number, colour: RGB, radius: number, amount: number) {
    if (!velocity || !dye) return;
    bindProgram('splat', velocity.texel);
    gl.uniform1i(uniform('splat', 'uTarget'), velocity.read.bind(0));
    gl.uniform1f(uniform('splat', 'aspect'), aspect);
    gl.uniform2f(uniform('splat', 'point'), x, y);
    gl.uniform3f(uniform('splat', 'color'), dx, dy, 0);
    gl.uniform1f(uniform('splat', 'radius'), radius);
    blit(velocity.write); velocity.swap();
    gl.uniform1i(uniform('splat', 'uTarget'), dye.read.bind(0));
    gl.uniform3f(uniform('splat', 'color'), colour[0] * amount, colour[1] * amount, colour[2] * amount);
    blit(dye.write); dye.swap();
  }

  function step(dt: number) {
    if (!velocity || !dye || !pressure || !divergence || !curl) return;
    bindProgram('curl', velocity.texel);
    gl.uniform1i(uniform('curl', 'uVel'), velocity.read.bind(0));
    blit(curl);

    bindProgram('vort', velocity.texel);
    gl.uniform1i(uniform('vort', 'uVel'), velocity.read.bind(0));
    gl.uniform1i(uniform('vort', 'uCurl'), curl.bind(1));
    gl.uniform1f(uniform('vort', 'curl'), 22);
    gl.uniform1f(uniform('vort', 'dt'), dt);
    blit(velocity.write); velocity.swap();

    bindProgram('div', velocity.texel);
    gl.uniform1i(uniform('div', 'uVel'), velocity.read.bind(0));
    blit(divergence);

    // Warm start: last frame's pressure, faded. The solve then converges in far fewer
    // iterations than it would from zero, which is where the iteration count comes from.
    bindProgram('clear', pressure.texel);
    gl.uniform1i(uniform('clear', 'uTex'), pressure.read.bind(0));
    gl.uniform1f(uniform('clear', 'value'), 0.8);
    blit(pressure.write); pressure.swap();

    bindProgram('press', pressure.texel);
    gl.uniform1i(uniform('press', 'uDiv'), divergence.bind(0));
    for (let i = 0; i < PRESSURE_STEPS; i++) {
      gl.uniform1i(uniform('press', 'uP'), pressure.read.bind(1));
      blit(pressure.write); pressure.swap();
    }

    bindProgram('grad', velocity.texel);
    gl.uniform1i(uniform('grad', 'uP'), pressure.read.bind(0));
    gl.uniform1i(uniform('grad', 'uVel'), velocity.read.bind(1));
    blit(velocity.write); velocity.swap();

    bindProgram('advect', velocity.texel);
    gl.uniform1i(uniform('advect', 'uVel'), velocity.read.bind(0));
    gl.uniform1i(uniform('advect', 'uSrc'), velocity.read.bind(0));
    gl.uniform1f(uniform('advect', 'dt'), dt);
    gl.uniform1f(uniform('advect', 'diss'), 0.32);
    blit(velocity.write); velocity.swap();

    bindProgram('advect', velocity.texel);
    gl.uniform1i(uniform('advect', 'uVel'), velocity.read.bind(0));
    gl.uniform1i(uniform('advect', 'uSrc'), dye.read.bind(1));
    gl.uniform1f(uniform('advect', 'diss'), 0.16);
    blit(dye.write); dye.swap();
  }

  function present(t: number) {
    if (!dye) return;
    bindProgram('show', dye.texel);
    gl.uniform1i(uniform('show', 'uDye'), dye.read.bind(0));
    gl.uniform3f(uniform('show', 'ground'), ground[0], ground[1], ground[2]);
    gl.uniform1f(uniform('show', 't'), t);
    gl.uniform1f(uniform('show', 'additive'), additive ? 1 : 0);
    blit(null);
  }

  /**
   * A drop of pigment and the push it gives the water.
   *
   * A seeding drop is wide and gentle where a live one is small and fast, but neither is
   * still: a drop with no velocity stays exactly where it lands, and eight of those are
   * eight dark discs rather than a fluid. It is the push that makes the pigment spread,
   * fold and thin, which is the whole difference between ink in water and a blurred circle.
   */
  function drop(seeding: boolean) {
    const x = 0.12 + Math.random() * 0.76;
    const y = 0.15 + Math.random() * 0.7;
    const angle = Math.random() * Math.PI * 2;
    const force = seeding ? 45 + Math.random() * 85 : 90 + Math.random() * 160;
    splat(x, y, Math.cos(angle) * force, Math.sin(angle) * force, nextPigment(),
      seeding ? 0.055 : 0.022, load(seeding ? 0.62 : 0.8));
  }

  /**
   * The opening state: six drops, and enough steps for them to meet and mix, rendered
   * once. Under reduced motion this is the whole of it — a still picture of ink in water,
   * which says what the motion says and asks nothing of anyone who has turned motion off.
   * The frame loop below never starts in that case.
   */
  let settleLeft = 0;
  function settle() {
    if (seeded) return;
    seeded = true;
    for (let i = 0; i < 6; i++) drop(true);
    for (let i = 0; i < SETTLE_FIRST; i++) step(1 / 60);
    settleLeft = SETTLE_STEPS - SETTLE_FIRST;
  }

  /** The rest of the settle, a few steps at a time. Returns true while there is more. */
  function settleMore(): boolean {
    if (settleLeft <= 0) return false;
    const n = Math.min(settleLeft, SETTLE_PER_FRAME);
    for (let i = 0; i < n; i++) step(1 / 60);
    settleLeft -= n;
    return true;
  }

  let raf = 0;
  let onScreen = true;
  let last = 0;
  let nextDrop = 0;
  let started = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (broken) return;
    if (!onScreen) { last = now; return; }
    const elapsed = (now - last) / 1000;
    // Half rate. The callback still runs every frame — it is the solver and the repaint
    // that are skipped, which is where all of the cost is.
    if (elapsed < STEP_EVERY) return;
    if (needsResize && !resize()) return;
    // Clamped, so a tab that was backgrounded for a minute does not resume by advancing
    // the fluid a minute in one step, which blows the velocity field apart.
    const dt = Math.min(0.04, elapsed);
    last = now;
    const t = (now - started) / 1000;
    if (!seeded) settle();
    settleMore();
    if (t > nextDrop) { drop(false); nextDrop = t + DROP_EVERY + Math.random() * 1.1; }
    step(dt);
    present(t);
  }

  const lost = (e: Event) => { e.preventDefault(); broken = true; };
  canvas.addEventListener('webglcontextlost', lost);

  if (!resize()) { releaseTargets(); return null; }
  settle();
  present(0);
  // Revealed only now that there is a picture on it. The canvas starts transparent in CSS,
  // so what has been showing until this moment is the still gradient underneath.
  canvas.style.opacity = '1';

  if (opts.reduced) {
    /*
     * No frame loop to finish the settle in, so it is finished on its own short one and
     * then stopped. Spread over frames rather than run in a block for the same reason as
     * everywhere else: this is a section arriving, and the main thread has other work.
     */
    const finish = () => {
      if (broken || !settleMore()) { raf = 0; return; }
      present(0);
      raf = requestAnimationFrame(finish);
    };
    raf = requestAnimationFrame(finish);
  } else {
    last = started = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /*
   * Offscreen sections stop simulating. This is the whole reason four of these can coexist:
   * each box is most of a viewport tall, so at any moment one is running and the rest are
   * costing nothing. The last entry, not the first — a batch delivered after a busy main
   * thread arrives oldest-first, and taking `[0]` of a [false, true] pair leaves a visible
   * box frozen until the next intersection change.
   */
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => { onScreen = entries[entries.length - 1].isIntersecting; })
    : null;
  io?.observe(canvas);

  /*
   * Under reduced motion there is no frame loop to notice the flag, and resizing the canvas
   * wipes its bitmap — so a window resize would leave a blank box where the picture was.
   * The still frame has to be made again here, on the spot.
   */
  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => {
        needsResize = true;
        if (!opts.reduced || broken) return;
        if (!resize()) return;
        settle();
        while (settleMore());
        present(0);
      })
    : null;
  ro?.observe(canvas);

  let px: number | null = null;
  let py: number | null = null;
  let pigmentClock = 0;
  const host = opts.host;
  const onPointer = (e: PointerEvent) => {
    if (opts.reduced || broken) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (px !== null && py !== null) {
      const dx = (x - px) * 5200;
      const dy = (y - py) * 5200;
      // The colour is changed on a clock rather than per move, so one sweep of the hand
      // draws one ribbon instead of a rainbow.
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        splat(x, y, dx, dy, pigments[Math.floor(pigmentClock / 900) % pigments.length], 0.0032, load(0.5));
      }
    }
    px = x; py = y; pigmentClock = performance.now();
  };
  const onLeave = () => { px = py = null; };
  host?.addEventListener('pointermove', onPointer, { passive: true });
  host?.addEventListener('pointerleave', onLeave, { passive: true });

  return {
    stir(x: number, y: number) {
      if (broken) return;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        splat(x, y, Math.cos(a) * 260, Math.sin(a) * 260, nextPigment(), 0.012, load(0.6));
      }
      // Under reduced motion nothing is repainting, so the stir has to present itself.
      if (opts.reduced) { step(1 / 60); present(0); }
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      ro?.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      host?.removeEventListener('pointermove', onPointer);
      host?.removeEventListener('pointerleave', onLeave);
      releaseTargets();
      gl.deleteBuffer(quad);
      for (const name of Object.keys(programs) as FragName[]) gl.deleteProgram(programs[name].p);
      gl.deleteShader(vs);
      // Four contexts is under every browser's limit, but a section that unmounts and
      // remounts (the phone breakpoint) would climb towards it without this.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

/**
 * How far ahead of the viewport a box starts building itself.
 *
 * Nearly a screen, so the work is finished before you arrive rather than at the moment you
 * do. Building is a WebGL2 context and ten shader programs, and no amount of spreading the
 * solver out helps with that — the only way for it not to be felt is for it to have already
 * happened. The sections are a screen apart, so at most two are ever live.
 */
const NEAR = '60%';

/**
 * The same simulation, built only once its box is nearly on screen.
 *
 * Three of these run on the landing page and a fourth inside Støtt oss, and building one is
 * not cheap: a WebGL2 context, ten shader programs, and enough solver steps for the opening
 * drops to bloom. Doing all four at mount put roughly eight thousand draw calls on the main
 * thread before the page was interactive — on a machine with a real GPU that is a stutter,
 * and under software rendering, which is what continuous integration and a Lighthouse run
 * both use, it is long enough that the hero's own setup misses its deadline. The suite
 * failed in twenty-seven places that had nothing to do with ink.
 *
 * Deferring costs nothing visually. The box already carries its colour in CSS, the canvas
 * is transparent until it has painted, and the sections are a screen apart — so they build
 * one at a time, as you arrive at each, which is also when the simulation first matters.
 */
export function createInkWhenNear(canvas: HTMLCanvasElement, opts: InkOptions): InkHandle {
  let live: InkHandle | null = null;
  let destroyed = false;

  const build = () => {
    if (destroyed || live) return;
    live = createInk(canvas, opts);
  };

  // No observer to defer with — build now rather than never.
  if (typeof IntersectionObserver !== 'function') {
    build();
    return {
      destroy() { destroyed = true; live?.destroy(); live = null; },
      stir(x, y) { live?.stir(x, y); },
    };
  }

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    build();
  }, { rootMargin: NEAR });
  io.observe(canvas);

  return {
    destroy() {
      destroyed = true;
      io.disconnect();
      live?.destroy();
      live = null;
    },
    stir(x, y) { live?.stir(x, y); },
  };
}
