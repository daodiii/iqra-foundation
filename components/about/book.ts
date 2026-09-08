/**
 * The book on Om oss. Each turning sheet is a real mesh bent around a cone, which is the
 * deformation iBooks used: the curl radius grows with distance from the cone's apex, so
 * the sheet fans open at the free edge and stays tight at the spine. A cylinder bends the
 * whole page by the same amount and reads as a rolled poster; a cone reads as paper.
 *
 * Per vertex, with x measured from the spine and A the apex position along it:
 *   R = sqrt(x^2 + (y-A)^2),  r = R sin(theta),  beta = asin(x/R) / sin(theta)
 *   v = ( r sin(beta),  R + A - r(1-cos beta) sin(theta),  r(1-cos beta) cos(theta) )
 * theta = pi/2 is a flat page and smaller is more curled. A must sit below the sheet so
 * y - A is positive everywhere, or the map mirrors about the apex.
 */
import { drawFace, faces, leafCount, type Face } from './pages';

/** Cone angle at the tightest point of a turn, and how far below the page the apex sits.
 *  These are the two values chosen from the mockups («krøll 30, vifte 75»). */
const THETA_MIN = 0.3 * (Math.PI / 2);
const APEX_K = 0.75;

const PW = 1.0, PH = 1.36;          // page size in world units
const NX = 40, NY = 56;             // mesh resolution
const TEX_W = 768, TEX_H = 1040;    // page texture size

// The lit look: bare paper on a warm ground, no lamp and no cast shadow.
const AMBIENT = 0.62;
const SPECULAR = 0.1;
const GUTTER = 0.9;
const LIGHT: [number, number, number] = [-1.6, 2.0, 2.4];
const CLEAR: [number, number, number] = [0.918, 0.91, 0.894];

export type BookHandle = {
  /** 0 to `turns`; fractional values are a sheet in flight. */
  setProgress(p: number): void;
  /** Index of the chapter the spread is showing, for the label beside the book. */
  chapterAt(p: number): number;
  readonly turns: number;
  destroy(): void;
};

const VS = `
precision highp float;
attribute vec2 aUV;
uniform mat4 uMVP;
uniform float uTheta, uApex, uRho, uPW, uPH;
varying vec2 vUV; varying vec3 vN; varying vec3 vPos;
vec3 conify(vec2 uv){
  float x = uv.x * uPW;
  float y = (uv.y - 0.5) * uPH;
  float dy = y - uApex;
  float R = sqrt(x * x + dy * dy);
  float st = max(sin(uTheta), 1e-4);
  float r = R * st;
  float beta = asin(clamp(x / max(R, 1e-5), -1.0, 1.0)) / st;
  vec3 v = vec3(r * sin(beta),
                R + uApex - r * (1.0 - cos(beta)) * st,
                r * (1.0 - cos(beta)) * cos(uTheta));
  float cr = cos(uRho), sr = sin(uRho);
  return vec3(v.x * cr - v.z * sr, v.y, v.x * sr + v.z * cr);
}
void main(){
  vec3 P = conify(aUV);
  float e = 0.004;
  vN = normalize(cross(conify(aUV + vec2(e, 0.0)) - P, conify(aUV + vec2(0.0, e)) - P));
  vUV = aUV; vPos = P;
  gl_Position = uMVP * vec4(P, 1.0);
}`;

const FS = `
precision highp float;
uniform sampler2D uFront, uBack;
uniform vec3 uLight, uEye;
uniform float uAmb, uSpec, uGutter;
varying vec2 vUV; varying vec3 vN; varying vec3 vPos;
void main(){
  vec2 uv = gl_FrontFacing ? vec2(vUV.x, 1.0 - vUV.y) : vec2(1.0 - vUV.x, 1.0 - vUV.y);
  vec4 tex = gl_FrontFacing ? texture2D(uFront, uv) : texture2D(uBack, uv);
  vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 L = normalize(uLight - vPos);
  vec3 H = normalize(L + normalize(uEye - vPos));
  float spec = pow(max(dot(N, H), 0.0), 42.0) * uSpec;
  float gut = mix(1.0, 0.72, uGutter * exp(-vUV.x * 7.0));
  gl_FragColor = vec4(tex.rgb * (uAmb + (1.0 - uAmb) * max(dot(N, L), 0.0)) * gut + spec, 1.0);
}`;

function perspective(fov: number, asp: number, n: number, f: number): number[] {
  const t = 1 / Math.tan(fov / 2);
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
}

function lookAt(e: number[], c: number[], u: number[]): number[] {
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const z = norm(sub(e, c)), x = norm(cross(u, z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
}

function mul(a: number[], b: number[]): number[] {
  const o = new Array<number>(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = s;
  }
  return o;
}

/** Which chapter a spread belongs to: cover, then one per chapter, then the contact page. */
export function chapterIndex(p: number, chapters: number): number {
  return Math.max(0, Math.min(chapters + 1, Math.round(p)));
}

export function createBook(canvas: HTMLCanvasElement): BookHandle | null {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) return null;

  // A driver that will not compile these shaders is a real possibility, and the page has
  // somewhere to go when it happens: returning null puts Om oss on its readable article
  // rather than throwing out of the effect and taking the route down with it.
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const verts: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) verts.push(i / NX, j / NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i;
    idx.push(a, a + 1, a + NX + 1, a + 1, a + NX + 2, a + NX + 1);
  }
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const aUV = gl.getAttribLocation(prog, 'aUV');
  gl.enableVertexAttribArray(aUV);
  gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uMVP', 'uTheta', 'uApex', 'uRho', 'uPW', 'uPH', 'uFront', 'uBack',
    'uLight', 'uEye', 'uAmb', 'uSpec', 'uGutter']) U[n] = gl.getUniformLocation(prog, n);

  const list: Face[] = faces();
  const tex = list.map((face) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawFace(face, TEX_W, TEX_H));
    // The page is 768x1040, which is not power-of-two. WebGL 1 leaves NPOT textures
    // incomplete if you ask for mipmaps or repeat wrapping, and an incomplete texture
    // samples as solid black. LINEAR with CLAMP_TO_EDGE is what NPOT is allowed.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  });
  const blank = tex[tex.length - 1];
  const turns = leafCount(list.length) - 1;

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  let progress = 0, resizeTimer = 0;

  function sheet(front: WebGLTexture | null, back: WebGLTexture | null, theta: number, apex: number, rho: number) {
    gl!.uniform1f(U.uTheta, theta);
    gl!.uniform1f(U.uApex, apex);
    gl!.uniform1f(U.uRho, rho);
    gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, front); gl!.uniform1i(U.uFront, 0);
    gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, back); gl!.uniform1i(U.uBack, 1);
    gl!.drawElements(gl!.TRIANGLES, idx.length, gl!.UNSIGNED_SHORT, 0);
  }

  function render() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(W * dpr), chh = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== chh) { canvas.width = cw; canvas.height = chh; }
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(CLEAR[0], CLEAR[1], CLEAR[2], 1);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    const asp = canvas.width / canvas.height;
    // A closed book is one page, not a spread, so centre on the page while it is shut
    // and drift to the spine as it opens; otherwise the first screen sits hard right.
    const cx = PW * 0.5 * (1 - Math.min(1, Math.max(0, progress)));
    const eye = [cx, 0.06, asp < 1.35 ? 3.9 : 3.05];
    const mvp = mul(perspective(0.62, asp, 0.1, 40), lookAt(eye, [cx, -0.02, 0], [0, 1, 0]));

    gl!.uniformMatrix4fv(U.uMVP, false, new Float32Array(mvp));
    gl!.uniform1f(U.uPW, PW); gl!.uniform1f(U.uPH, PH);
    gl!.uniform3fv(U.uLight, LIGHT);
    gl!.uniform3fv(U.uEye, eye);
    gl!.uniform1f(U.uAmb, AMBIENT);
    gl!.uniform1f(U.uSpec, SPECULAR);
    gl!.uniform1f(U.uGutter, GUTTER);

    const p = Math.max(0, Math.min(turns - 1e-4, progress));
    const i = Math.floor(p), t = p - i;
    const FLAT = Math.PI / 2, apex = -PH * 0.5 - APEX_K;

    // The spread underneath: the page being revealed on the right, and on the left the
    // back of the sheet already turned. The left one is flipped to pi, so the camera
    // sees its BACK face — its content has to be the back texture or it renders blank.
    sheet(tex[2 * i + 2] ?? blank, blank, FLAT, apex, 0);
    if (i > 0) sheet(blank, tex[2 * i - 1] ?? blank, FLAT, apex, Math.PI);

    // And the sheet in the air: flat at both ends of the turn, tightest in the middle.
    const curl = FLAT - (FLAT - THETA_MIN) * Math.sin(Math.PI * t);
    sheet(tex[2 * i] ?? blank, tex[2 * i + 1] ?? blank, curl, apex, Math.PI * t);
  }

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(render, 200);
  };
  window.addEventListener('resize', onResize);
  render();

  return {
    turns,
    setProgress(p: number) { progress = p; render(); },
    chapterAt(p: number) { return chapterIndex(p, 3); },
    destroy() {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      tex.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(vbo); gl.deleteBuffer(ibo); gl.deleteProgram(prog);
    },
  };
}
