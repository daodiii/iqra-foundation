/**
 * Walks the content object and returns human-readable problems.
 * Empty strings are always a problem. The email placeholder is a problem
 * only when `production` is true, so local builds and e2e keep working
 * until the real address arrives.
 */
export function contentProblems(site, { production }) {
  const problems = [];
  const walk = (value, path) => {
    if (typeof value === 'string') {
      if (value.trim() === '') problems.push(`${path} is empty`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, v] of Object.entries(value)) walk(v, path ? `${path}.${key}` : key);
    }
  };
  walk(site, '');
  if (production && site.contact.email.includes('[')) {
    problems.push('contact.email is still the [EPOST] placeholder');
  }
  return problems;
}
