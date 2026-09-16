// WCAG contrast of the brand pairs: node contrast.mjs [fg bg]...
const hex = (h) => h.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round((v * (1 - t) + B[i] * t) * 255).toString(16).padStart(2, '0')).join(''); };

const P = { navy: '#2c394b', turquoise: '#67c1bf', light: '#f0f0f1', dark: '#393e46', crimson: '#ab5261', white: '#ffffff' };
const args = process.argv.slice(2);
const pairs = args.length ? args.reduce((acc, _, i) => (i % 2 ? acc : [...acc, [args[i], args[i + 1]]]), []) : [
  ['navy', 'white'], ['navy', 'light'], ['navy', 'turquoise'], ['white', 'navy'], ['light', 'navy'], ['turquoise', 'navy'],
  ['white', 'crimson'], ['crimson', 'white'], ['crimson', 'light'], ['white', 'dark'], ['turquoise', 'dark'], ['crimson', 'navy'],
  ['turquoise', 'white'], ['navy', 'crimson'], ['light', 'turquoise'], ['white', 'turquoise'],
];
for (const [f, b] of pairs) {
  const fg = P[f] ?? f, bg = P[b] ?? b;
  const r = ratio(fg, bg);
  console.log(`${f.padEnd(10)} on ${b.padEnd(10)} ${r.toFixed(2)}:1 ${r >= 4.5 ? 'AA text' : r >= 3 ? 'large only' : 'FAIL'}`);
}
console.log('ink-soft (navy 72% + white):', mix(P.navy, P.white, 0.28), ratio(mix(P.navy, P.white, 0.28), P.white).toFixed(2) + ':1 on white', ratio(mix(P.navy, P.white, 0.28), P.light).toFixed(2) + ':1 on light');
console.log('turquoise-deep (70% turquoise into navy):', mix(P.turquoise, P.navy, 0.3), ratio(mix(P.turquoise, P.navy, 0.3), P.white).toFixed(2) + ':1 on white');
console.log('crimson lifted for navy (60% crimson into white):', mix(P.crimson, P.white, 0.4), ratio(mix(P.crimson, P.white, 0.4), P.navy).toFixed(2) + ':1 on navy');
