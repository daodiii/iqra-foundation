import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(ctx2d as unknown as CanvasRenderingContext2D);

Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve(), load: () => Promise.resolve([]) } });
