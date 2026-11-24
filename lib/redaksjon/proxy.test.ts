import { describe, expect, test } from 'vitest';
import { crossSiteWrite } from '@/proxy';

const req = (method: string, headers: Record<string, string> = {}) => new Request('https://www.iqrasti.no/api/redaksjon/nyheter', { method, headers });

describe('a write must come from the site itself', () => {
  test('another site posting through the editor login is refused', () => {
    expect(crossSiteWrite(req('POST', { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }))).toBe(true);
    expect(crossSiteWrite(req('POST', { 'sec-fetch-site': 'same-site' }))).toBe(true); // another *.iqrasti.no
    expect(crossSiteWrite(req('DELETE', { origin: 'https://iqrasti.no' }))).toBe(true);
  });
  test('the editor\'s own pages, reads and non-browser calls pass', () => {
    expect(crossSiteWrite(req('POST', { origin: 'https://www.iqrasti.no', 'sec-fetch-site': 'same-origin' }))).toBe(false);
    expect(crossSiteWrite(req('GET', { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(crossSiteWrite(req('PUT'))).toBe(false);
  });
});
