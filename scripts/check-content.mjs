import { site } from '../content/site.no.ts';
import { contentPlaceholders, contentProblems } from './lib/content-check.mjs';

const production = process.env.VERCEL_ENV === 'production';
const problems = contentProblems(site, { production });
if (problems.length) {
  console.error('Content check failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}

// Outside production the placeholders are allowed, but say how many are left and where,
// so nobody discovers the count for the first time from a failed deploy.
const left = contentPlaceholders(site);
if (left.length) {
  const list = left.map(({ path, token }) => `  ${path} ${token}`).join('\n');
  console.log(`content ok, with ${left.length} placeholder${left.length === 1 ? '' : 's'} still in place`);
  console.log(`${list}\na production deploy will refuse these`);
} else {
  console.log('content ok');
}
