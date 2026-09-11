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
