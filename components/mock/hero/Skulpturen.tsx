'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { ChapterFilm, HOME_ORDER, useChapters } from './chapters';
import styles from './skulpturen.module.css';

/** The order the letters stand up in: the art lists a, i, Q, R; they stand i, Q, R, a. */
const STAND = [3, 0, 1, 2];
const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** One SVG path → its extruded geometry, turned into three's y-up space (a rotation, so the faces keep their winding). */
function extrude(d: string, transform: string, depth: number, bevel: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOCKUP_VIEWBOX}"><path transform="${transform}" d="${d}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth,
    curveSegments: 28,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.7,
    bevelSegments: 5,
  });
  g.rotateX(Math.PI);
  return g;
}

/**
 * MOCK 4 Skulpturen. The guide's lockup as an object: iQRa cut from solid navy, 60 units deep with a
 * rounded edge, the film on the letters' faces, the crimson dot and tail in lacquer, FOUNDATION in
 * navy under them; in a white studio with real light, reflections and a soft shadow on the floor (taste-skill-ignore: a cast shadow in a 3D scene)
 * (three.js: RoomEnvironment for the reflections, one key light with VSM shadows). Arrival: the
 * letters turn from edge-on to face the room one after another on a spring, the dot drops onto the i, the word
 * slides forward. Then the object turns towards the pointer (a slow sway on a phone). The four
 * areas at the right edge change the film on the faces.
 */
export function Skulpturen() {
  const ch = useChapters(HOME_ORDER, 400);
  const hero = useRef<HTMLElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const films = useRef<HTMLDivElement>(null);
  const active = useRef(0);
  useEffect(() => {
    active.current = ch.active;
  }, [ch.active]);

  useEffect(() => {
    const host = holder.current;
    const section = hero.current;
    if (!host || !section) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      section.setAttribute('data-nogl', '');
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Neutral, not ACES: ACES lifted the crimson to pink and the navy to slate.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;

    // --- the film, from the chapters' videos: one texture per shot, the active one on the faces ---
    const vids = Array.from(films.current?.querySelectorAll('video') ?? []);
    const textures = vids.map((v) => {
      const t = new THREE.VideoTexture(v);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    });

    const VW = Number(LOCKUP_VIEWBOX.split(' ')[2]);
    const unit = 10 / VW; // the lockup ten units wide
    const navy = new THREE.MeshPhysicalMaterial({ color: '#2c394b', roughness: 0.34, metalness: 0.08, clearcoat: 0.9, clearcoatRoughness: 0.18 });
    const lacquer = new THREE.MeshPhysicalMaterial({ color: '#ab5261', roughness: 0.28, metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.08 });
    const face = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0, emissive: '#ffffff', emissiveIntensity: 0.78 });
    if (textures[0]) {
      face.map = textures[0];
      face.emissiveMap = textures[0];
    }

    // The letters' box, for the film's planar mapping across all four faces (cover-fit, 16:9).
    const letterGeos = MARK_LETTERS.map((p) => extrude(p.d, p.transform, 60, 3));
    const box = new THREE.Box3();
    letterGeos.forEach((g) => {
      g.computeBoundingBox();
      box.union(g.boundingBox!);
    });
    const bw = box.max.x - box.min.x;
    const bh = box.max.y - box.min.y;
    letterGeos.forEach((g) => {
      const pos = g.getAttribute('position');
      const uv = g.getAttribute('uv');
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - box.min.x) / bw, (pos.getY(i) - box.min.y) / bh);
      uv.needsUpdate = true;
    });
    const fit = (t: THREE.Texture) => {
      const boxAspect = bw / bh;
      const vAspect = 16 / 9;
      t.repeat.set(1, 1);
      t.offset.set(0, 0);
      if (boxAspect > vAspect) {
        t.repeat.y = vAspect / boxAspect;
        t.offset.y = (1 - t.repeat.y) / 2;
      } else {
        t.repeat.x = boxAspect / vAspect;
        t.offset.x = (1 - t.repeat.x) / 2;
      }
    };
    textures.forEach(fit);

    const root = new THREE.Group();
    root.scale.setScalar(unit);
    const lockup = new THREE.Group();
    root.add(lockup);
    scene.add(root);
    // Centre the lockup on the origin (the art's box), its foot on y = 0 after the scale.
    const word = LOCKUP_WORD.map((p) => extrude(p.d, p.transform, 22, 1.6));
    const all = new THREE.Box3().copy(box);
    word.forEach((g) => {
      g.computeBoundingBox();
      all.union(g.boundingBox!);
    });
    const cx = (all.min.x + all.max.x) / 2;
    lockup.position.set(-cx, -all.min.y, 0);

    const shadowed = (m: THREE.Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };
    // Each letter on its own upright axis, so it can turn from edge-on to face the room.
    const hinges = letterGeos.map((g, k) => {
      const b = g.boundingBox!;
      const hinge = new THREE.Group();
      hinge.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
      const mesh = shadowed(new THREE.Mesh(g, [face, navy]));
      mesh.position.set(-hinge.position.x, -hinge.position.y, 0);
      hinge.add(mesh);
      lockup.add(hinge);
      return { hinge, order: STAND[k] };
    });
    // The tail rides on the Q's hinge; the dot drops on its own.
    const tailGeo = extrude(MARK_ACCENTS[0].d, MARK_ACCENTS[0].transform, 64, 3);
    const qHinge = hinges[2].hinge;
    const tail = shadowed(new THREE.Mesh(tailGeo, lacquer));
    tail.position.set(-qHinge.position.x, -qHinge.position.y, 2);
    qHinge.add(tail);
    const dot = shadowed(new THREE.Mesh(extrude(MARK_ACCENTS[1].d, MARK_ACCENTS[1].transform, 60, 3), lacquer));
    const dotGroup = new THREE.Group();
    dotGroup.add(dot);
    lockup.add(dotGroup);
    const wordGroup = new THREE.Group();
    word.forEach((g) => wordGroup.add(shadowed(new THREE.Mesh(g, navy))));
    lockup.add(wordGroup);

    // --- the studio: a floor that only takes the shadow, one key light, a soft fill ---
    const floorY = 0;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.13 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY - 0.002;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.HemisphereLight('#ffffff', '#d9dde3', 0.6));
    const key = new THREE.DirectionalLight('#fff7ee', 2.1);
    key.position.set(-5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.radius = 14;
    key.shadow.blurSamples = 20;
    key.shadow.bias = -0.0004;
    scene.add(key);

    const lockupH = (all.max.y - all.min.y) * unit;
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
    const look = new THREE.Vector3(0, lockupH * 0.5, 0);
    const size = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const fov = THREE.MathUtils.degToRad(camera.fov);
      // On a wide screen the object keeps clear of the index at the right and the copy at the foot.
      const wide = camera.aspect >= 1;
      look.y = lockupH * (wide ? 0.36 : 0.5);
      const fitW = (10 * (wide ? 1.5 : 1.12)) / 2 / (Math.tan(fov / 2) * camera.aspect);
      const fitH = (lockupH * (wide ? 2.1 : 1.5)) / 2 / Math.tan(fov / 2);
      const dist = Math.max(fitW, fitH);
      camera.position.set(0, look.y + dist * 0.16, dist);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    // --- the pointer: the object turns towards it ---
    const aim = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let pointer = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer = true;
      const r = section.getBoundingClientRect();
      aim.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      aim.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    section.addEventListener('pointermove', onMove);

    let shown = true;
    const io = new IntersectionObserver(([e]) => (shown = e.isIntersecting));
    io.observe(section);

    // Every program compiled off the main thread before the clock starts (KHR_parallel_shader_compile):
    // compiled synchronously, each cost 0.2-1 s on the main thread (a trace showed GetProgramiv waits).
    dotGroup.visible = true;
    let compiled = false;
    renderer.compileAsync(scene, camera).then(() => (compiled = true), () => (compiled = true));
    // Each shot's first upload into WebGL cost 0.3-0.9 s the first time it played. Upload every one as
    // soon as it has a frame, and start the entrance once all are in (at most 1.8 s): the studio holds
    // empty a moment, then the letters turn without a stall.
    let armed = false;
    let warmed = 0;
    const arm = window.setTimeout(() => (armed = true), 2500);
    vids.forEach((v, i) => {
      const warm = () => {
        renderer.initTexture(textures[i]);
        if (++warmed === vids.length) armed = true;
      };
      if (v.readyState >= 2) warm();
      else v.addEventListener('loadeddata', warm, { once: true });
    });
    if (!vids.length) armed = true;
    let raf = 0;
    let lastActive = 0;
    let asked = 0;
    let ready = 0;
    let t0 = -1;
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (!shown) return;
      if (t0 < 0 && armed && compiled) t0 = time + 150;
      const t = reduced ? 1e9 : t0 < 0 ? -1 : (time - t0) / 1000;
      // Arrival: each letter turns from edge-on to face the room on a spring, 0.17 s apart; the dot falls onto the i; the word slides in.
      hinges.forEach(({ hinge, order }) => {
        const p = clamp01((t - order * 0.17) / 1.15);
        hinge.rotation.y = (Math.PI / 2) * (1 - easeOutBack(p));
      });
      const pd = clamp01((t - 0.95) / 0.75);
      const fall = pd < 0.7 ? (pd / 0.7) ** 2 : 1 - Math.sin(((pd - 0.7) / 0.3) * Math.PI) * 0.08;
      dotGroup.position.y = (1 - fall) * 420;
      dotGroup.visible = t > 0.95;
      const pw = easeOutCubic(clamp01((t - 1.1) / 1.2));
      wordGroup.position.z = (1 - pw) * -260;
      wordGroup.position.y = (1 - pw) * -40;
      // The turn: towards the pointer, or a slow sway where there is none.
      const sway = pointer ? 0 : Math.sin(time / 2600) * 0.16;
      now.x += ((pointer ? aim.x * 0.32 : sway) - now.x) * 0.05;
      now.y += ((pointer ? aim.y * 0.1 : 0) - now.y) * 0.05;
      root.rotation.y = now.x;
      root.rotation.x = now.y * 0.6;
      // A new shot goes on the faces only once its video has shown a frame: read straight after its seek
      // and play, WebGL waited on the decoder (0.5-1.2 s frames). Until then the last frame stays.
      if (active.current !== asked && vids[active.current]) {
        asked = active.current;
        const want = asked;
        const v = vids[want];
        v.requestVideoFrameCallback(() => (ready = want));
      }
      if (ready !== lastActive && textures[ready]) {
        lastActive = ready;
        face.map = textures[lastActive];
        face.emissiveMap = textures[lastActive];
        // No needsUpdate: a texture for a texture keeps the program; flagging it recompiled the shader (a 0.6 s frame).
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    section.setAttribute('data-live', '');

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(arm);
      ro.disconnect();
      io.disconnect();
      section.removeEventListener('pointermove', onMove);
      textures.forEach((t) => t.dispose());
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="skulptur-tittel">
      <h1 id="skulptur-tittel" className={styles.hidden}>{site.logoAlt}</h1>
      <div ref={holder} className={styles.canvas} aria-hidden="true">
        <p className={styles.fallback}>{site.logoAlt}</p>
      </div>
      {/* The shots' videos feed the faces; they are not shown themselves. */}
      <div ref={films} className={styles.films}>
        <ChapterFilm chapters={HOME_ORDER} active={ch.active} video={ch.video} />
      </div>
      <ul className={styles.chapters} aria-label="Fire områder">
        {HOME_ORDER.map((c, i) => (
          <li key={c.key} style={{ '--i': i } as CSSProperties}>
            <button type="button" className={styles.chapter} aria-pressed={i === ch.active} onClick={() => ch.choose(i)}>
              <span className={styles.name}>{c.name}</span>
              <span className={styles.track}>
                <span ref={ch.bar(i)} className={styles.fill} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.band}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
    </section>
  );
}
