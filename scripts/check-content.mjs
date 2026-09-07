import { site } from '../content/site.no.ts';
import { contentProblems } from './lib/content-check.mjs';

const production = process.env.VERCEL_ENV === 'production';
const problems = contentProblems(site, { production });
if (problems.length) {
  console.error('Content check failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}
const note = site.contact.email.includes('[')
  ? ' (email placeholder still in place; a production deploy will refuse it)'
  : '';
console.log('content ok' + note);
