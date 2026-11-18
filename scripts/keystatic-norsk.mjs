// Keystatic's Norwegian calls its save button «Skape»; the editor should say «Lagre», the word
// Keystatic already uses when a post is changed. Keystatic has no setting for its own words, so
// this runs after every install (Vercel's too) and swaps the one word in its nb-NO list.
// If a Keystatic update moves or rewords that list, the install stops here, so the change is
// never lost without anyone noticing.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'node_modules', '@keystatic', 'core', 'dist');
const from = '"create": `Skape`,';
const to = '"create": `Lagre`,';

let done = 0;
for (const name of readdirSync(dist).filter((n) => n.endsWith('.js'))) {
  const file = join(dist, name);
  const text = readFileSync(file, 'utf8');
  const at = text.indexOf('"nb-NO": {');
  if (at === -1) continue;
  const block = text.slice(at, text.indexOf('}', at));
  if (block.includes(to)) { done++; continue; }
  if (!block.includes(from)) continue;
  writeFileSync(file, text.slice(0, at) + block.replace(from, to) + text.slice(at + block.length));
  done++;
}

if (done === 0) {
  console.error('keystatic-norsk: found no «Skape» in Keystatic\'s nb-NO list. Has Keystatic changed? See scripts/keystatic-norsk.mjs.');
  process.exit(1);
}
console.log(`keystatic-norsk: the editor's save button says «Lagre» (${done} file).`);
