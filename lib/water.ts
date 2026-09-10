/**
 * Clear water over a coloured floor.
 *
 * A height field, not a fluid: one texture holding this height and the last one, and the
 * wave equation stepped across it — `n = ((L+R+T+B)/2 − previous) · damp`. Rain falls on it,
 * a light wind rubs the surface, and the pointer drags a wake. Everything you actually see
 * comes from the show pass, which refracts a view of the floor through the surface normal,
 * multiplies in the caustic net the curvature makes, and puts a glint where the light
 * reflects.
 *
 * Why a second solver rather than more of `lib/ink.ts`: the page's idea is that the ink
 * clears. Ink is pigment carried by a fluid, so the fluid is what has to be simulated and
 * the picture is the dye it moves; water is clear, so there is nothing to carry and the
 * whole picture is the SURFACE — a field of heights and what the light does on the way
 * through it. The ink's solver would have had to be told to hold no dye at all and then
 * asked for the one thing it does not compute. This is about a twentieth of its cost per
 * frame, which is what makes three of them affordable under the two ink boxes above.
 *
 * Like the ink, it is written to be skippable: `createWater` returns null on any device that
 * cannot run it, and the CSS ground and still picture underneath are a complete answer.
 */

export type RGB = [number, number, number];

/**
 * A pool of colour on the floor: a hex, where it sits (0-1, y up), how wide it is in units
 * of the box's height, and how strongly it stains the ground there.
 *
 * These are what makes the floor a scene rather than a flat colour. They drift, slowly,
 * so the bottom of the box is never quite the same twice.
 */
export type Pool = readonly [hex: string, x: number, y: number, radius: number, alpha: number];

/**
 * The shader holds this many pools, and the loop over them is unrolled at compile time —
 * a seventh pool in a scene would not fail, it would silently never be drawn.
 */
export const POOL_LIMIT = 6;

/** One of the film's scenes, seen through water, at every depth it could be seen at. */
export type WaterScene = {
  /** The floor in the shallowest water the page allows, and in the deepest. See `DEPTH`. */
  pale: string;
  deep: string;
  pools: readonly Pool[];
  /**
   * Light in dark water rather than colour on a floor: the pools ADD to the ground instead
   * of staining it, and the depth does not touch any of it. The night card is the only one.
   */
  night?: boolean;
  /** Set only where the depth ramp is not wanted — which is the night card, and only it. */
  caus?: number;
  spec?: number;
};

/** A scene resolved at one depth: what the shaders are actually given. */
export type WaterFloor = {
  ground: string;
  pools: readonly Pool[];
  /** How hard the surface's curvature focuses light into the caustic net. */
  caus: number;
  /** The glint where the light reflects off the surface towards you. */
  spec: number;
  night: boolean;
};

/**
 * How deep the water is, from 0 (a pale wash you can barely read as water) to 1.
 *
 * One number for every box on the page, because two boxes of water at different depths read
 * as two different bodies of water rather than as one idea. It sets three things at once —
 * the floor colour, the caustic net, the glint — since that is what depth does: more water
 * between you and the bottom means a darker floor AND more bending of the light on the way.
 *
 * **0.70 is the user's number**, given on 2026-09-10. I had recommended 0.50 from frames
 * shot at 20, 50 and 80: at 20 the water barely read, at 80 it was heavier than the ink
 * boxes above it, which contradicts the page's whole idea of clearing. 50 sat right on the
 * ink's weight but the green came out minty, and 70 is the answer to that.
 */
export const DEPTH = 0.7;

/* The depth ramps. Each is a straight line between what the shallowest water looks like and
   what the deepest does; the numbers came from watching the slider in the mockup. */
const CAUS = [1.9, 3.4] as const;
const SPEC = [0.45, 0.95] as const;
/** The pools gain a little too, or they would wash out as the ground around them darkened. */
const POOL_ALPHA = [0.8, 1.05] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hexToRgb = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/**
 * Mixed in sRGB bytes rather than in light.
 *
 * A physically correct mix through linear light would pass through a lighter middle than
 * this one does, and that is exactly what is not wanted: these two hexes are the ends of a
 * look that was chosen by eye on a slider, so the middle has to be the one that was seen on
 * that slider. The rounding is fixed so a floor colour is a hex the stylesheet can hold.
 */
export function mixHex(a: string, b: string, t: number): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join('');
}

/** A scene at one depth. The night card is returned as it was written: see `WaterScene`. */
export function floorAt(scene: WaterScene, depth: number): WaterFloor {
  const night = !!scene.night;
  if (night) {
    return {
      ground: scene.pale,
      pools: scene.pools,
      caus: scene.caus ?? CAUS[1],
      spec: scene.spec ?? SPEC[1],
      night,
    };
  }
  const gain = lerp(POOL_ALPHA[0], POOL_ALPHA[1], depth);
  return {
    ground: mixHex(scene.pale, scene.deep, depth),
    pools: scene.pools.map(([hex, x, y, r, a]) => [hex, x, y, r, a * gain] as const),
    caus: scene.caus ?? lerp(CAUS[0], CAUS[1], depth),
    spec: scene.spec ?? lerp(SPEC[0], SPEC[1], depth),
    night,
  };
}

export type WaterHandle = {
  destroy(): void;
  /** Drop something heavy in. Coordinates are 0-1, y up. */
  stir(x: number, y: number): void;
};

export type WaterOptions = {
  reduced: boolean;
  floor: WaterFloor;
  /**
   * The element the pointer is tracked on — the box, not the canvas, so the surface answers
   * a hand moving over the copy as well as over the water. Omitted, it only rains.
   */
  host?: HTMLElement | null;
};

/*
 * The shaders. As in `lib/ink.ts`, `#version 300 es` must be the first line of the source,
 * so these are template literals with no leading newline, and the four neighbour lookups
 * every stencil here needs are computed once in the vertex shader.
 */
const VERT = `#version 300 es
precision highp float; layout(location = 0) in vec2 p; out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB; uniform vec2 texel;
void main(){ vUv = p * .5 + .5; vL = vUv - vec2(texel.x, 0.); vR = vUv + vec2(texel.x, 0.); vT = vUv + vec2(0., texel.y); vB = vUv - vec2(0., texel.y); gl_Position = vec4(p, 0., 1.); }`;

const H = `#version 300 es
precision highp float; precision highp sampler2D; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; out vec4 o;`;

const FRAG = {
  /**
   * The wave equation, discretised: the average of the four neighbours tells this point
   * where the surface wants to be, the height it held last step tells it how fast it is
   * already going, and `damp` takes a little off so a pool that is left alone goes still.
   * `r` is the height now, `g` the height before — one texture, two moments.
   */
  wave: `${H}uniform sampler2D uH; uniform float damp;
    void main(){ vec2 h = texture(uH, vUv).rg;
      float L = texture(uH, vL).r, R = texture(uH, vR).r, T = texture(uH, vT).r, B = texture(uH, vB).r;
      o = vec4(((L + R + T + B) * .5 - h.g) * damp, h.r, 0., 1.); }`,
  /** A drop: a gaussian dent in the surface, added to the height only. */
  splat: `${H}uniform sampler2D uH; uniform vec2 point; uniform float aspect; uniform float radius; uniform float amp;
    void main(){ vec2 h = texture(uH, vUv).rg; vec2 d = vUv - point; d.x *= aspect;
      o = vec4(h.r + amp * exp(-dot(d, d) / (radius * radius)), h.g, 0., 1.); }`,
  /**
   * Surface to picture.
   *
   * The gradient of the height field is the surface's tilt, which gives the normal; looking
   * along it moves the sample point on the floor, and that displacement IS refraction — the
   * reason the pools wobble. The Laplacian is the curvature, and a curved surface focuses
   * or spreads the light that passes through it, which is the caustic net. The glint is a
   * plain Blinn term with the light where the film has it, high and to the left.
   *
   * The dither is not decoration: across a floor this smooth an 8-bit framebuffer bands
   * visibly, and half an LSB of noise costs nothing and removes it.
   */
  show: `${H}uniform sampler2D uH; uniform float aspect; uniform float t; uniform float night;
    uniform float refr; uniform float caus; uniform float spec; uniform float slope;
    uniform vec3 ground; uniform int np; uniform vec4 pools[${POOL_LIMIT}]; uniform vec3 pcol[${POOL_LIMIT}];
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 floorAt(vec2 p){ vec2 q = vec2(p.x * aspect, p.y); vec3 c = ground;
      for (int i = 0; i < ${POOL_LIMIT}; i++) { if (i >= np) break;
        vec2 d = q - vec2(pools[i].x * aspect, pools[i].y);
        /* Wider than they are tall. A circular pool on a box this shape reads as a ball
           rather than as something lying on the bottom. */
        d.y *= 1.35;
        float a = pools[i].w * exp(-dot(d, d) / (pools[i].z * pools[i].z));
        c = night > .5 ? c + pcol[i] * a : mix(c, pcol[i], a); }
      return c; }
    void main(){ float h = texture(uH, vUv).r;
      float L = texture(uH, vL).r, R = texture(uH, vR).r, T = texture(uH, vT).r, B = texture(uH, vB).r;
      vec2 g = vec2(R - L, T - B); float lap = L + R + T + B - 4. * h;
      vec3 n = normalize(vec3(-g * slope, 1.));
      vec3 col = floorAt(clamp(vUv + n.xy * refr, 0., 1.));
      col *= 1. + clamp(-lap * caus, -.55, 1.4);
      vec3 Ld = normalize(vec3(-.4, .6, .7));
      col += pow(max(reflect(-Ld, n).z, 0.), 70.) * spec * (night > .5 ? vec3(1., .88, .7) : vec3(1.));
      col += (hash(gl_FragCoord.xy + fract(t)) - .5) * (2. / 255.);
      o = vec4(col, 1.); }`,
} as const;

type FragName = keyof typeof FRAG;

/** Held back a touch under 1, or the surface rings forever and the box hums. */
const DAMP = 0.988;
/** The canvas is drawn at half CSS resolution and scaled up; water has no hard edges. */
const DRAW_SCALE = 0.5;
/**
 * The height field, as a fraction of the box in CSS pixels, and its longest side.
 *
 * Wavelength is what this number really sets: the grid is the smallest ripple there can be,
 * so a finer field does not give a better picture, it gives a different — busier — one. The
 * cap matters most on a wide desktop box, where the fraction alone would ask for a field
 * twice the size for ripples nobody would call larger.
 */
const SIM_SCALE = 0.42;
const SIM_MAX = 760;
/** Enough field that a splat is a ring rather than four pixels, on the narrowest phone. */
const SIM_MIN = 48;
/** Rain: the gap between drops, plus a random part of this size. */
const RAIN = [0.5, 0.9] as const;
const RAIN_NIGHT = [0.6, 1.0] as const;
/**
 * Wind: a wide, shallow, alternating nudge every `GUST` seconds.
 *
 * This is what stops the box looking like a pond in a cellar. Rain alone gives clean
 * expanding rings on glass; the shimmer between them — the thing that reads as outdoors —
 * is this, and it is the cheapest line in the file.
 */
const WIND = 0.06;
const GUST = 0.07;
const GUST_NIGHT = 0.08;
/** How far the normal moves the floor sample. More than this and the floor swims. */
const REFR = 0.065;
const REFR_NIGHT = 0.06;
/** How steep the surface is taken to be. The heights are tiny; this is what makes them read. */
const SLOPE = 5.5;
const SLOPE_NIGHT = 6;
/**
 * Steps run before the first paint.
 *
 * The same problem as the ink's settle, with a gentler answer: an unstepped height field is
 * flat, and flat water with a caustic net on it is a photograph of a floor. These are enough
 * for the seeding drops to cross the box, meet, and leave the surface busy everywhere rather
 * than in five circles. It is cheap enough to run in one go — the ink's equivalent is a
 * pressure solve per step, this is one pass over a small texture.
 */
const SEED_STEPS = 110;
/** How many steps a frame may take, so a long frame does not advance the water in one jump. */
const STEPS_MAX = 3;
const DT_MAX = 0.05;

export function createWater(canvas: HTMLCanvasElement, opts: WaterOptions): WaterHandle | null {
  const context = canvas.getContext('webgl2', {
    alpha: false, antialias: false, premultipliedAlpha: false, depth: false, stencil: false,
  });
  if (!context) return null;
  // Re-declared with the type rather than left to narrowing, for the same reason as in
  // `lib/ink.ts`: the hoisted helpers below would otherwise reason about a nullable `gl`.
  const gl: WebGL2RenderingContext = context;
  // The height field is a half-float texture and this is what allows rendering INTO one.
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;
  /*
   * And decline where there is no GPU behind the context, exactly as the ink does and for
   * the evidence gathered there: a software rasteriser answers every capability question
   * with yes and then runs the whole thing on the CPU, and a page that has stopped
   * repainting takes every animation on it down with it. Cheaper than the ink is still far
   * too expensive without a GPU, and the still picture in CSS is a complete answer.
   */
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|softpipe|software rasterizer|basic render/i.test(renderer)) return null;
  gl.getExtension('OES_texture_float_linear');

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('water: shader failed', gl.getShaderInfoLog(s));
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

  type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number; bind(unit: number): number };
  const owned: Target[] = [];

  function target(w: number, h: number): Target | null {
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) return null;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, w, h, 0, gl.RG, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const t: Target = {
      tex, fb, w, h,
      bind(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; },
    };
    owned.push(t);
    return t;
  }

  /** The field is read and written in the same pass, so it needs two of everything. */
  type Pair = { readonly read: Target; readonly write: Target; swap(): void };
  function pair(w: number, h: number): Pair | null {
    let a = target(w, h);
    let b = target(w, h);
    if (!a || !b) return null;
    // The two swap by rebinding these locals; `read` and `write` are getters, so `swap` is
    // the only way round and an assignment from outside would silently do nothing.
    return {
      get read() { return a as Target; },
      get write() { return b as Target; },
      swap() { const t = a; a = b; b = t; },
    };
  }

  const floor = opts.floor;
  const night = floor.night;
  const ground = hexToRgb(floor.ground).map((v) => v / 255) as RGB;
  const pools = floor.pools.slice(0, POOL_LIMIT).map(([hex, x, y, r, a], i) => ({
    x, y, r, a,
    colour: hexToRgb(hex).map((v) => v / 255) as RGB,
    // A different phase each, so the pools wander independently instead of sliding about
    // in formation. Any irrational-ish spacing does; this one was picked and left alone.
    phase: i * 1.9,
  }));
  const poolArr = new Float32Array(POOL_LIMIT * 4);
  const colourArr = new Float32Array(POOL_LIMIT * 3);
  pools.forEach((p, i) => colourArr.set(p.colour, i * 3));
  const refr = night ? REFR_NIGHT : REFR;
  const slope = night ? SLOPE_NIGHT : SLOPE;
  const rain = night ? RAIN_NIGHT : RAIN;
  const gust = night ? GUST_NIGHT : GUST;

  let field: Pair | null = null;
  let sw = 1;
  let sh = 1;
  let aspect = 1;
  let seeded = false;
  let broken = false;
  /*
   * Set by the ResizeObserver, read by the frame loop: `getBoundingClientRect` forces
   * layout, and three of these measuring every frame would be a self-inflicted bottleneck.
   */
  let needsResize = true;

  function resize(): boolean {
    needsResize = false;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(64, Math.round(rect.width * DRAW_SCALE));
    const h = Math.max(64, Math.round(rect.height * DRAW_SCALE));
    if (canvas.width === w && canvas.height === h && field) return true;
    canvas.width = w;
    canvas.height = h;
    aspect = w / h;
    // Every target is replaced, so the old ones go here rather than leaking per resize.
    releaseTargets();
    const scale = Math.min(SIM_SCALE, SIM_MAX / Math.max(rect.width, rect.height));
    sw = Math.max(SIM_MIN, Math.round(rect.width * scale));
    sh = Math.max(SIM_MIN, Math.round(rect.height * scale));
    field = pair(sw, sh);
    seeded = false;
    if (!field) { broken = true; return false; }
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
  const bindProgram = (name: FragName) => {
    gl.useProgram(programs[name].p);
    gl.uniform2f(uniform(name, 'texel'), 1 / sw, 1 / sh);
  };
  const blit = (to: Target | null) => {
    if (to) { gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb); gl.viewport(0, 0, to.w, to.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  function drop(x: number, y: number, amp: number, radius: number) {
    if (!field) return;
    bindProgram('splat');
    gl.uniform1i(uniform('splat', 'uH'), field.read.bind(0));
    gl.uniform2f(uniform('splat', 'point'), x, y);
    gl.uniform1f(uniform('splat', 'aspect'), aspect);
    gl.uniform1f(uniform('splat', 'radius'), radius);
    gl.uniform1f(uniform('splat', 'amp'), amp);
    blit(field.write); field.swap();
  }

  function step() {
    if (!field) return;
    bindProgram('wave');
    gl.uniform1i(uniform('wave', 'uH'), field.read.bind(0));
    gl.uniform1f(uniform('wave', 'damp'), DAMP);
    blit(field.write); field.swap();
  }

  /** Rain falls INTO the water, so every drop is negative: a dent, not a bump. */
  const raindrop = () => drop(
    0.06 + Math.random() * 0.88, 0.08 + Math.random() * 0.84,
    -(0.22 + Math.random() * 0.4), 0.004 + Math.random() * 0.005,
  );
  const windGust = () => drop(
    Math.random(), Math.random(), (Math.random() - 0.5) * WIND, 0.03 + Math.random() * 0.05,
  );

  function present(t: number) {
    if (!field) return;
    for (let i = 0; i < pools.length; i++) {
      const p = pools[i];
      /*
       * The drift. Two slow, mismatched periods per pool, so the floor is never in the same
       * arrangement twice and never visibly repeats — it is the difference between a scene
       * on the bottom and a texture pinned to it. Small: at 0.06 of the width the pools
       * breathe, at anything more they migrate, and the composition stops being a
       * composition.
       */
      poolArr[i * 4] = p.x + 0.06 * Math.sin(t * 0.09 + p.phase);
      poolArr[i * 4 + 1] = p.y + 0.04 * Math.cos(t * 0.07 + p.phase * 1.3);
      poolArr[i * 4 + 2] = p.r;
      poolArr[i * 4 + 3] = p.a;
    }
    bindProgram('show');
    gl.uniform1i(uniform('show', 'uH'), field.read.bind(0));
    gl.uniform1f(uniform('show', 'aspect'), aspect);
    gl.uniform1f(uniform('show', 't'), t);
    gl.uniform1f(uniform('show', 'night'), night ? 1 : 0);
    gl.uniform1f(uniform('show', 'refr'), refr);
    gl.uniform1f(uniform('show', 'caus'), floor.caus);
    gl.uniform1f(uniform('show', 'spec'), floor.spec);
    gl.uniform1f(uniform('show', 'slope'), slope);
    gl.uniform3f(uniform('show', 'ground'), ground[0], ground[1], ground[2]);
    gl.uniform1i(uniform('show', 'np'), pools.length);
    gl.uniform4fv(uniform('show', 'pools'), poolArr);
    gl.uniform3fv(uniform('show', 'pcol'), colourArr);
    blit(null);
  }

  /**
   * The opening state: five drops and enough steps for them to cross the box and meet.
   *
   * This is what the section looks like when you arrive at it, which is the only view most
   * people get — the simulation is paused until the box is on screen, so it cannot rely on
   * having run for a while. Flat water would be a picture of a floor with a caustic net
   * painted on it, which is precisely the screensaver this is not supposed to be.
   */
  function seed() {
    if (seeded) return;
    seeded = true;
    for (let i = 0; i < 5; i++) raindrop();
    for (let i = 0; i < SEED_STEPS; i++) {
      if (i % 4 === 0) windGust();
      if (i % 22 === 10) raindrop();
      step();
    }
  }

  let raf = 0;
  let onScreen = true;
  let last = 0;
  let started = 0;
  let nextRain = 0;
  let nextWind = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (broken) return;
    if (!onScreen) { last = now; return; }
    if (needsResize && !resize()) return;
    // Clamped, so a tab that was backgrounded does not resume by stepping the surface a
    // minute in one frame — which in a wave equation is not a fast-forward, it is a blow-up.
    const dt = Math.min(DT_MAX, (now - last) / 1000);
    last = now;
    const t = (now - started) / 1000;
    seed();
    if (t > nextRain) { raindrop(); nextRain = t + rain[0] + Math.random() * rain[1]; }
    if (t > nextWind) { windGust(); nextWind = t + gust; }
    const steps = Math.max(1, Math.min(STEPS_MAX, Math.round(dt * 60)));
    for (let i = 0; i < steps; i++) step();
    present(t);
  }

  const lost = (e: Event) => { e.preventDefault(); broken = true; };
  canvas.addEventListener('webglcontextlost', lost);

  if (!resize()) { releaseTargets(); return null; }
  seed();
  present(0);
  // Revealed only now that there is a picture on it. The canvas starts transparent in CSS,
  // so what has been showing until this moment is the still gradient underneath.
  canvas.style.opacity = '1';

  if (!opts.reduced) {
    last = started = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /*
   * Offscreen boxes stop stepping. Three of these and two ink boxes share the page, and each
   * is most of a viewport tall, so at any moment one or two are running and the rest cost
   * nothing. The last entry, not the first — a batch delivered after a busy main thread
   * arrives oldest-first, and taking `[0]` of a [false, true] pair freezes a visible box.
   */
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => { onScreen = entries[entries.length - 1].isIntersecting; })
    : null;
  io?.observe(canvas);

  /*
   * Under reduced motion there is no frame loop to notice the resize flag, and resizing a
   * canvas wipes its bitmap — so a window resize would leave a blank box where the still
   * water was. It has to be made again here, on the spot.
   */
  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => {
        needsResize = true;
        if (!opts.reduced || broken) return;
        if (!resize()) return;
        seed();
        present(0);
      })
    : null;
  ro?.observe(canvas);

  /*
   * The wake. Speed is measured in the box's own coordinates per second rather than in
   * pixels, so a hand crossing the box makes the same wake on a phone as on a desktop; the
   * floor under 0.05 is there because a pointer that has stopped still emits moves, and
   * those would be a string of drops in one place rather than nothing.
   */
  let px: number | null = null;
  let py: number | null = null;
  let pt = 0;
  const host = opts.host;
  const onPointer = (e: PointerEvent) => {
    if (opts.reduced || broken) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    const now = performance.now();
    const dt = (now - pt) / 1000;
    if (px !== null && py !== null && dt > 0) {
      const speed = Math.min(3, Math.hypot(x - px, y - py) / dt);
      if (speed >= 0.05) drop(x, y, -0.03 - 0.08 * speed, 0.005 + 0.003 * speed);
    }
    px = x; py = y; pt = now;
  };
  const onLeave = () => { px = py = null; };
  host?.addEventListener('pointermove', onPointer, { passive: true });
  host?.addEventListener('pointerleave', onLeave, { passive: true });

  return {
    stir(x: number, y: number) {
      if (broken) return;
      // Deeper and wider than rain by a long way: this answers a press, and a press that
      // makes the same ring as a raindrop reads as a coincidence rather than an answer.
      drop(x, y, -1.2, 0.016);
      // Under reduced motion nothing is repainting, so the stir has to present itself.
      if (opts.reduced) { step(); present(0); }
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
      // Five contexts on one page is under every browser's limit, but a section that
      // unmounts and remounts (the phone breakpoint) would climb towards it without this.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

/**
 * How far ahead of the viewport a box starts building itself. As with the ink: nearly a
 * screen, so the work is finished before you arrive rather than at the moment you do.
 */
const NEAR = '60%';

/**
 * The same water, built only once its box is nearly on screen.
 *
 * Three of these run on the landing page under two ink boxes, and while each is far cheaper
 * to RUN than the ink, building one is the same kind of work: a WebGL2 context, three shader
 * programs, and a hundred and ten steps of settling. Doing that for five boxes at mount is
 * the stutter the ink was deferred to avoid, and it would land while the page is still
 * arriving. Deferring costs nothing visually — the box carries its colour in CSS and the
 * canvas is transparent until it has painted.
 */
export function createWaterWhenNear(canvas: HTMLCanvasElement, opts: WaterOptions): WaterHandle {
  let live: WaterHandle | null = null;
  let destroyed = false;

  const build = () => {
    if (destroyed || live) return;
    live = createWater(canvas, opts);
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
