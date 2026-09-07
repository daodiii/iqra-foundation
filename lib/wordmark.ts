/** The header is fixed and transparent; whoever changes the ground behind it says so here. */
export function setWordmarkOnDark(onDark: boolean): void {
  document.getElementById('site-wordmark')?.setAttribute('data-on-dark', String(onDark));
}
