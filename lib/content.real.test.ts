import { expect, test } from 'vitest';
import { getDocuments, getEvents, getNews, getPeople, getResources } from './content';

/**
 * The build leaves a broken record out and goes on (lib/content.ts), so one bad save by an
 * editor cannot stop the site. Our own changes are held to more: every record under content/
 * must read. A failure names the file and the field.
 */
test('every record in content/ reads; none is left out', () => {
  const problems: string[] = [];
  const skip = (p: string) => void problems.push(p);
  getEvents(undefined, skip);
  getNews(undefined, skip);
  getResources(undefined, skip);
  getDocuments(undefined, skip);
  getPeople(undefined, skip);
  expect(problems).toEqual([]);
});
