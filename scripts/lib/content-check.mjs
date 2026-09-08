/**
 * A bracketed token — [EPOST], [Navn], [N] — is copy standing in for something nobody
 * has supplied yet. They are deliberate while the site is being built, and the one
 * moment they must not survive is a production build, which is the only time they would
 * reach anyone. Matched by shape rather than by a list of known names, so a placeholder
 * invented later is caught without anyone remembering to add it here.
 */
const PLACEHOLDER = /\[[^\]]+\]/;

/** Visits every string in the content, depth first, with a readable path to it. */
function walkStrings(value, visit, path = '') {
  if (typeof value === 'string') {
    visit(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, visit, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      walkStrings(v, visit, path ? `${path}.${key}` : key);
    }
  }
}

/** Every string still carrying a placeholder, with where it lives. */
export function contentPlaceholders(site) {
  const found = [];
  walkStrings(site, (value, path) => {
    const match = value.match(PLACEHOLDER);
    if (match) found.push({ path, token: match[0] });
  });
  return found;
}

/**
 * Walks the content object and returns human-readable problems. Empty strings are
 * always a problem. Placeholders are a problem only when `production` is true, so local
 * builds and the e2e keep working until the real names, numbers and address arrive.
 */
export function contentProblems(site, { production }) {
  const problems = [];
  walkStrings(site, (value, path) => {
    if (value.trim() === '') problems.push(`${path} is empty`);
  });
  if (production) {
    for (const { path, token } of contentPlaceholders(site)) {
      problems.push(`${path} is still the ${token} placeholder`);
    }
  }
  return problems;
}
