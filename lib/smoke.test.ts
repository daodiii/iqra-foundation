import { expect, test } from 'vitest';

test('vitest runs with jsdom and the canvas stub', () => {
  document.body.innerHTML = '<canvas></canvas>';
  const c = document.querySelector('canvas') as HTMLCanvasElement;
  expect(c.getContext('2d')).not.toBeNull();
});
