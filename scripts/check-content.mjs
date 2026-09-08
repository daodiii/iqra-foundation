import { site } from '../content/site.no.ts';
import { contentPlaceholders, contentProblems, paymentPlaceholders } from './lib/content-check.mjs';

const production = process.env.VERCEL_ENV === 'production';

/**
 * The gate exists so a half-written page cannot reach the public, and by default it still
 * refuses one. This holds it open on purpose, so the site can go live while the copy is
 * openly unfinished — set in vercel.json rather than in the dashboard, so the decision
 * sits in the diff and is removed by deleting four lines rather than by remembering that
 * a setting exists somewhere.
 *
 * Delete `build.env.ALLOW_PLACEHOLDERS` from vercel.json to put the gate back.
 */
const allowPlaceholders = process.env.ALLOW_PLACEHOLDERS === '1';

const problems = contentProblems(site, { production, allowPlaceholders });
if (problems.length) {
  console.error('Content check failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}

const left = contentPlaceholders(site);
if (!left.length) {
  console.log('content ok');
} else if (production && allowPlaceholders) {
  // Loud, and loudest about the four that matter: this is a live page telling people
  // where to send money, and it is about to tell them «[KONTO]».
  const payment = paymentPlaceholders(site);
  console.warn(
    `\n!! DEPLOYING ${left.length} PLACEHOLDER${left.length === 1 ? '' : 'S'} TO PRODUCTION\n` +
    '!! ALLOW_PLACEHOLDERS=1 is set in vercel.json, so the content gate was skipped.',
  );
  if (payment.length) {
    console.warn(
      `!! ${payment.length} of them are payment details and will be public:\n` +
      payment.map(({ path, token }) => `!!   ${path} ${token}`).join('\n') +
      '\n!! Nobody can donate until these are real.',
    );
  }
  console.warn('!! Remove build.env.ALLOW_PLACEHOLDERS from vercel.json to refuse this again.\n');
} else {
  // Outside production the placeholders are allowed, but say how many are left and where,
  // so nobody discovers the count for the first time from a failed deploy.
  const list = left.map(({ path, token }) => `  ${path} ${token}`).join('\n');
  console.log(`content ok, with ${left.length} placeholder${left.length === 1 ? '' : 's'} still in place`);
  console.log(`${list}\na production deploy will refuse these`);
}
