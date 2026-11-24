import { describe, expect, test } from 'vitest';
import { blobPath, fileMode, isStoredName, refusal, storedName } from './upload';

describe('where files go', () => {
  test('Blob when its token is there; off in production without it; this checkout under dev', () => {
    expect(fileMode({ BLOB_READ_WRITE_TOKEN: 'x', NODE_ENV: 'production' })).toBe('blob');
    expect(fileMode({ NODE_ENV: 'production' })).toBe('off');
    expect(fileMode({ NODE_ENV: 'development', REDAKSJON_GITHUB_TOKEN: 't' })).toBe('off');
    expect(fileMode({ NODE_ENV: 'production', REDAKSJON_LOCAL_ROOT: '/tmp/x' })).toBe('local');
    expect(fileMode({ NODE_ENV: 'development' })).toBe('local');
  });
});

describe('what may be uploaded', () => {
  test('a PDF, Word or PowerPoint as a file; MP4 or WebM as a video', () => {
    expect(refusal('file', 'Årsrapport 2025.PDF', 1000)).toBeNull();
    expect(refusal('file', 'notat.docx', 1000)).toBeNull();
    expect(refusal('file', 'film.mp4', 1000)).toMatch(/PDF/);
    expect(refusal('video', 'film.mov', 1000)).toMatch(/MP4/);
    expect(refusal('video', 'film.webm', 1000)).toBeNull();
  });
  test('too big or empty is refused', () => {
    expect(refusal('file', 'a.pdf', 51 * 1024 * 1024)).toMatch(/50 MB/);
    expect(refusal('video', 'a.mp4', 501 * 1024 * 1024)).toMatch(/500 MB/);
    expect(refusal('file', 'a.pdf', 0)).toMatch(/tom/);
  });
});

describe('stored names', () => {
  test('safe, readable, with the ending kept and a tail', () => {
    expect(storedName('Årsrapport 2025 (endelig).PDF', 'ab12cd')).toBe('arsrapport-2025-endelig-ab12cd.pdf');
    expect(storedName('Søknad om støtte.docx', 'zz99zz')).toBe('soknad-om-stotte-zz99zz.docx');
    expect(storedName('...mp4', 'aaaaaa')).toBe('fil-aaaaaa.mp4');
  });
  test('the route takes only such names', () => {
    expect(isStoredName(storedName('Rapport.pdf', 'ab12cd'))).toBe(true);
    for (const bad of ['../x.pdf', 'a/b.pdf', 'A.pdf', 'x.exe', 'x.pdf.html', '.pdf', '']) expect(isStoredName(bad)).toBe(false);
    expect(blobPath('a-ab12cd.pdf')).toBe('ressurser/a-ab12cd.pdf');
  });
});
