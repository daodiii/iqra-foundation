// Lighthouse, the binary directly (lhci's cleanup crashes on Windows): node run.mjs <port> <worktree> [paths...]
// Prints performance, accessibility, best-practices and CLS for each path, mobile defaults like lighthouserc.json.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const [port, worktree = 'iqra-foundation-identitet', ...paths] = process.argv.slice(2);
// Output goes under $SCRATCH (or ./.scratch, gitignored); pass SCRATCH=<dir> to put it elsewhere.
const OUT_ROOT = (process.env.SCRATCH ?? '.scratch') + '/lh';

const urls = (paths.length ? paths : ['/', '/vart-arbeid']).map((p) => `http://localhost:${port}${p}`);
const OUT = OUT_ROOT;
const bin = path.join('C:/Users/daodi/code', worktree, 'node_modules/lighthouse/cli/index.js');
for (const url of urls) {
  const name = url.replace(/[^a-z0-9]+/gi, '-');
  const out = path.join(OUT, `${name}.json`);
  const r = spawnSync(process.execPath, [bin, url, '--output=json', `--output-path=${out}`, '--chrome-flags=--headless=new', '--quiet', '--only-categories=performance,accessibility,best-practices'], { encoding: 'utf8', timeout: 180000 });
  if (r.status !== 0) { console.log(url, 'lighthouse exit', r.status, (r.stderr || '').slice(-400)); continue; }
  const j = JSON.parse(readFileSync(out, 'utf8'));
  const c = j.categories;
  const cls = j.audits['cumulative-layout-shift']?.numericValue;
  const lcp = j.audits['largest-contentful-paint']?.numericValue;
  console.log(`${url}: performance ${c.performance.score} · accessibility ${c.accessibility.score} · best-practices ${c['best-practices'].score} · CLS ${cls?.toFixed(3)} · LCP ${Math.round(lcp)}ms`);
  const a11y = Object.values(j.audits).filter((a) => a.score !== null && a.score < 1 && c.accessibility.auditRefs.some((r) => r.id === a.id)).map((a) => `  a11y: ${a.id} ${a.title}`);
  if (a11y.length) console.log(a11y.join('\n'));
}
