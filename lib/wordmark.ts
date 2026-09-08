/** The header is fixed and transparent; whoever changes the ground behind it says so here. */
export function setWordmarkOnDark(onDark: boolean): void {
  document.getElementById('site-wordmark')?.setAttribute('data-on-dark', String(onDark));
}

/**
 * The header's own elements. Only the landing page hides the header — the hero fades it
 * in once the letters have opened — and it has to reach both the wordmark and the nav,
 * which live outside the hero's GSAP scope and so cannot be found by selector string.
 */
export function headerElements(): HTMLElement[] {
  return ['site-wordmark', 'site-nav']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
}
