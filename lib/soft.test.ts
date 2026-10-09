import { expect, test, vi } from 'vitest';

const { soft } = await vi.importActual<typeof import('./soft')>('./soft');

test('a soft hyphen at each known compound’s joint, the case kept, the words otherwise untouched', () => {
  expect(soft('aktiv samfunnsdeltakelse.')).toBe('aktiv samfunns\u00ADdeltakelse.');
  expect(soft('Samfunnsdeltakelse')).toBe('Samfunns\u00ADdeltakelse');
  expect(soft('i skjæringspunktet mellom')).toBe('i skjærings\u00ADpunktet mellom');
  expect(soft('Vi utvikler kunnskap')).toBe('Vi utvikler kunnskap');
  expect(soft('samfunnsdeltakelse').replace(/\u00AD/g, '')).toBe('samfunnsdeltakelse');
});
