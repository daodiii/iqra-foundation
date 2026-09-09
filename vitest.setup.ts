import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Without this every render stays mounted for the rest of the file: queries then match
// the previous test's DOM as well as this one's, and any component holding a frame loop
// (the tree, the ink) never gets its cleanup and keeps animating alongside the tests.
afterEach(cleanup);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }),
});

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.load = vi.fn();
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.canPlayType = vi.fn().mockReturnValue('probably');

// jsdom has no layout, so it has no scrollTo; ScrollTrigger's pin calls it on setup.
window.scrollTo = () => {};

class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IO });

// jsdom has no ResizeObserver either, and unlike IntersectionObserver it is not guarded at
// its call site: Støtt oss re-measures its heading with one, so without this the section
// throws on mount and every test in that file fails with the same ReferenceError — which
// reads like a broken component rather than a missing piece of the environment.
class RO { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: RO });

// A 2D context stub: every drawing call is a no-op; gradients are inert objects.
const gradient = { addColorStop: () => {} };
const ctx2d = new Proxy({}, {
  get: (_t, key) => {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    if (key === 'measureText') return () => ({ width: 10 });
    return () => {};
  },
  set: () => true,
});
// Only '2d' is stubbed. jsdom genuinely has no WebGL, so asking for it must return null
// the way a real browser without it does — otherwise the book's renderer is handed a
// context whose every call returns undefined and it fails deep inside shader compilation
// instead of falling back to the readable article.
HTMLCanvasElement.prototype.getContext = vi.fn((type: string) =>
  type === '2d' ? (ctx2d as unknown as CanvasRenderingContext2D) : null,
) as unknown as HTMLCanvasElement['getContext'];

// Goes with the context stub above: jsdom has no Path2D either, and the tree collects each
// depth of branches into one so the whole depth casts a single blurred stroke.
class Path2DStub { moveTo() {} lineTo() {} }
Object.defineProperty(window, 'Path2D', { writable: true, value: Path2DStub });

Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve(), load: () => Promise.resolve([]) } });
